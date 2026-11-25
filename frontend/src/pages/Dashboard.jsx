import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
	LuArrowLeft,
	LuArrowUpRight,
	LuBriefcase,
	LuBuilding2,
	LuExternalLink,
	LuGlobe,
	LuMail,
	LuMapPin,
	LuPhone,
	LuRefreshCw,
	LuTriangleAlert,
} from 'react-icons/lu';

import { Navbar } from '../components/Navbar';
import { Skeleton } from '../components/Skeleton';
import { logoutUser } from '../api/auth';
import { normalizeDomain, researchCompany } from '../api/research';
import { notify } from '../utils/toast';

/* ---------- Helpers ---------- */

const PLATFORMS = {
	'linkedin.com': 'LinkedIn',
	'facebook.com': 'Facebook',
	'instagram.com': 'Instagram',
	'twitter.com': 'X (Twitter)',
	'x.com': 'X (Twitter)',
	'youtube.com': 'YouTube',
	't.me': 'Telegram',
	'pinterest.com': 'Pinterest',
};

const hostOf = (url) => {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
};

const safeHref = (url) => (/^https?:\/\//i.test(url) ? url : undefined);

const platformLabel = (url) => PLATFORMS[hostOf(url)] ?? hostOf(url);

const phoneHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const companyName = ({ websiteUrl, result }) => {
	const title = result.sources?.[0]?.title?.split(/[|\-–—:·•]/)[0].trim();
	return title && title.length <= 40 ? title : hostOf(websiteUrl);
};

const prefersReducedMotion = () =>
	typeof window !== 'undefined' &&
	window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Motion hooks ---------- */

/* Flips to true one frame after mount so CSS transitions can run */
function useReady() {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let inner = 0;
		const outer = requestAnimationFrame(() => {
			inner = requestAnimationFrame(() => setReady(true));
		});
		return () => {
			cancelAnimationFrame(outer);
			cancelAnimationFrame(inner);
		};
	}, []);

	return ready;
}

/* Counts up to a numeric target; returns null for non-numeric values */
function useCountUp(target, ready, duration = 1100) {
	const numeric =
		typeof target === 'number'
			? target
			: /^\d+$/.test(String(target ?? ''))
				? Number(target)
				: null;
	const [value, setValue] = useState(0);

	useEffect(() => {
		if (numeric == null || !ready) return undefined;

		if (prefersReducedMotion()) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setValue(numeric);
			return undefined;
		}

		let raf = 0;
		const start = performance.now();
		const tick = (now) => {
			const t = Math.min(1, (now - start) / duration);
			setValue(Math.round(numeric * (1 - Math.pow(1 - t, 4))));
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(raf);
	}, [numeric, ready, duration]);

	return numeric == null ? null : value;
}

/* ---------- Tile system ---------- */

const TONES = {
	dark: {
		box: 'bg-surface border border-line',
		label: 'text-muted',
		value: 'text-fg',
	},
	raised: {
		box: 'bg-surface-2 border border-line-strong',
		label: 'text-muted',
		value: 'text-fg',
	},
};

const Tile = ({
	tone = 'dark',
	index = 0,
	ready,
	flush = false,
	className = '',
	children,
}) => (
	<section
		style={{ transitionDelay: ready ? `${index * 70}ms` : '0ms' }}
		className={`flex flex-col rounded-card transition duration-700 ease-out motion-reduce:transition-none ${TONES[tone].box} ${
			flush ? '' : 'p-5 sm:p-6'
		} ${ready ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'} ${className}`}
	>
		{children}
	</section>
);

const TileTitle = ({ tone = 'dark', right, children }) => (
	<div className='flex items-center justify-between gap-3'>
		<h2 className={`text-[13px] ${TONES[tone].label}`}>{children}</h2>
		{right}
	</div>
);

const CountBadge = ({ children }) => (
	<span className='rounded-full border border-line-strong bg-surface-2 px-2.5 py-0.5 text-xs text-muted'>
		{children}
	</span>
);

const ExternalLink = ({ href, children, className = '' }) => (
	<a
		href={safeHref(href)}
		target='_blank'
		rel='noopener noreferrer'
		className={`inline-flex items-center gap-1.5 text-accent-hover transition-colors duration-150 hover:text-fg hover:underline ${className}`}
	>
		{children}
		<LuExternalLink className='size-3.5 shrink-0' aria-hidden='true' />
	</a>
);

const ExpandableList = ({
	items,
	limit = 4,
	renderItem,
	listClassName = 'space-y-3 text-sm',
	buttonClassName = 'mt-4',
}) => {
	const [showAll, setShowAll] = useState(false);
	const visible = showAll ? items : items.slice(0, limit);

	return (
		<>
			<ul className={listClassName}>{visible.map(renderItem)}</ul>

			{items.length > limit && (
				<button
					type='button'
					onClick={() => setShowAll((value) => !value)}
					className={`text-[13px] font-medium text-accent-hover transition-colors hover:text-fg hover:underline ${buttonClassName}`}
				>
					{showAll ? 'Show fewer' : `Show ${items.length - limit} more`}
				</button>
			)}
		</>
	);
};

/* ---------- Charts ---------- */

const EASE = 'ease-[cubic-bezier(0.16,1,0.3,1)]';

/* Circular gauge */
const Ring = ({ value, max, ready }) => {
	const radius = 70;
	const circumference = 2 * Math.PI * radius;
	const progress = max ? value / max : 0;
	const counted = useCountUp(value, ready, 1400);

	return (
		<div className='relative mx-auto grid size-44 place-items-center'>
			<svg
				viewBox='0 0 168 168'
				className='absolute inset-0 -rotate-90'
				aria-hidden='true'
			>
				<circle
					cx='84'
					cy='84'
					r={radius}
					fill='none'
					className='stroke-line-strong'
					strokeWidth='6'
				/>
				<circle
					cx='84'
					cy='84'
					r={radius}
					fill='none'
					strokeWidth='6'
					strokeLinecap='round'
					strokeDasharray={circumference}
					strokeDashoffset={ready ? circumference * (1 - progress) : circumference}
					className='stroke-accent-hover transition-[stroke-dashoffset] duration-[1400ms] ease-out motion-reduce:transition-none'
				/>
			</svg>
			<div className='text-center'>
				<p className='text-5xl font-semibold tabular-nums tracking-[-0.04em] text-fg'>
					{counted ?? value}
					<span className='text-lg font-normal text-subtle'>/{max}</span>
				</p>
				<p className='mt-1 text-[13px] text-muted'>fields found</p>
			</div>
		</div>
	);
};

/* Thin horizontal progress bar */
const Meter = ({ value, max, ready, delay = 0 }) => (
	<div className='h-1 w-full overflow-hidden rounded-full bg-line-strong'>
		<div
			className={`h-full rounded-full bg-accent-hover transition-[width] duration-1000 motion-reduce:transition-none ${EASE}`}
			style={{
				width: ready ? `${max ? (value / max) * 100 : 0}%` : '0%',
				transitionDelay: `${delay}ms`,
			}}
		/>
	</div>
);

const ContactTile = ({
	icon: Icon,
	label,
	count,
	max,
	index,
	ready,
	children,
}) => (
	<Tile index={index} ready={ready}>
		<TileTitle right={<Icon className='size-4 text-subtle' aria-hidden='true' />}>
			{label}
		</TileTitle>

		<div className='mt-4'>
			<div className='mb-2.5 flex items-baseline justify-between'>
				<span className='text-3xl font-semibold tabular-nums tracking-[-0.03em] text-fg'>
					{count}
				</span>
				<span className='text-[13px] text-subtle'>found</span>
			</div>
			<Meter value={count} max={max} ready={ready} delay={300 + index * 60} />
		</div>

		<div className='mt-5'>{children}</div>
	</Tile>
);

const contactLink =
	'break-all text-sm text-fg/90 transition-colors hover:text-accent-hover';

/* ---------- Profile view ---------- */

/* Nebula glow + twinkling sparks for the top-right corner of the Company card */
const STARS = Array.from({ length: 24 }, (_, i) => ({
	left: 42 + (((i * 97) % 100) / 100) * 58,
	top: (((i * 53) % 100) / 100) * 78,
	size: 1.5 + (i % 3) * 0.75,
	delay: (i * 370) % 3200,
	duration: 2200 + ((i * 211) % 2400),
}));

const CompanyGlow = () => (
	<div aria-hidden='true' className='pointer-events-none absolute inset-0'>
		<div className='absolute inset-0 animate-glow bg-[radial-gradient(ellipse_60%_90%_at_100%_0%,var(--color-accent)_0%,transparent_65%)] opacity-50 motion-reduce:animate-none' />
		<div className='absolute inset-0 bg-[radial-gradient(ellipse_35%_55%_at_92%_0%,var(--color-accent-hover)_0%,transparent_70%)] opacity-25' />
		<div className='absolute inset-0 [mask-image:radial-gradient(ellipse_65%_95%_at_100%_0%,black,transparent_75%)]'>
			{STARS.map((star, i) => (
				<span
					key={i}
					className='absolute animate-twinkle rounded-full bg-fg opacity-60 shadow-[0_0_6px_var(--color-fg)] motion-reduce:animate-none'
					style={{
						left: `${star.left}%`,
						top: `${star.top}%`,
						width: star.size,
						height: star.size,
						animationDelay: `${star.delay}ms`,
						animationDuration: `${star.duration}ms`,
					}}
				/>
			))}
		</div>
	</div>
);

/* One row of the dashboard: columns adapt to how many cards have data */
const Row = ({ count, children }) =>
	count === 0 ? null : (
		<div
			style={{ '--cols': count }}
			className='grid auto-rows-[minmax(10rem,auto)] gap-3 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))] lg:[&>*:last-child:nth-child(odd)]:col-span-1'
		>
			{children}
		</div>
	);

const InlineStat = ({ label, value, ready }) => {
	const counted = useCountUp(value, ready);

	return (
		<div>
			<p className='text-[13px] text-muted'>{label}</p>
			<p className='mt-0.5 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-fg'>
				{counted != null ? counted.toLocaleString() : value}
			</p>
		</div>
	);
};

function CompanyProfileView({ data, onRefresh }) {
	const ready = useReady();
	const { websiteUrl, result } = data;
	const name = companyName(data);

	const services = result.services ?? [];
	const offices = result.office_locations ?? [];
	const jobs = result.job_opportunities ?? [];
	const sources = result.sources ?? [];
	const {
		emails = [],
		phone_numbers: phones = [],
		social_links: socials = [],
	} = result.contact_details ?? {};

	const hasContacts = emails.length + phones.length + socials.length > 0;
	const channelMax = Math.max(emails.length, phones.length, socials.length, 1);

	const hasCareers = jobs.length > 0 || !!result.careers_url;

	const researchedOn = result.created
		? new Date(result.created).toLocaleDateString(undefined, {
				dateStyle: 'medium',
			})
		: null;

	const coverage = [
		{ label: 'Industry', ok: !!result.industry },
		{ label: 'Employees', ok: !!result.employee_count },
		{ label: 'About', ok: !!result.summary },
		{ label: 'Services', ok: services.length > 0 },
		{ label: 'Offices', ok: offices.length > 0 },
		{ label: 'Open roles', ok: jobs.length > 0 },
		{ label: 'Contact', ok: hasContacts },
		{ label: 'Careers page', ok: !!result.careers_url },
	];
	const found = coverage.filter((field) => field.ok).length;

	const row2 = [!!result.summary, !!result.industry, true].filter(
		Boolean,
	).length;
	const row3 = [emails.length, phones.length, socials.length].filter(
		Boolean,
	).length;
	const row5 = [offices.length > 0, hasCareers].filter(Boolean).length;

	return (
		<div className='space-y-3'>
			{/* Row 1: Company (full width) */}
			<Row count={1}>
				<Tile index={0} ready={ready} className='relative isolate overflow-hidden'>
					<CompanyGlow />

					<div className='relative min-w-0'>
						<h1 className='truncate text-3xl font-semibold tracking-[-0.035em] text-fg sm:text-4xl'>
							{name}
						</h1>
						{researchedOn && (
							<p className='mt-3 flex items-center gap-2 text-sm text-fg'>
								<span className='size-2.5 rounded-full bg-success' />
								Researched {researchedOn}
							</p>
						)}
						<p className='mt-2 text-[15px] text-muted'>{hostOf(websiteUrl)}</p>
					</div>

					<div className='relative mt-auto flex flex-wrap items-end justify-between gap-6 pt-10'>
						<div className='flex flex-wrap gap-3'>
							<button
								type='button'
								onClick={onRefresh}
								className='inline-flex items-center gap-2 rounded-xl border border-line-strong px-5 py-3 text-sm text-fg transition duration-200 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-hover active:scale-[0.98]'
							>
								<LuRefreshCw className='size-4 text-muted' aria-hidden='true' />
								Refresh
							</button>
						</div>

						{!!result.employee_count && (
							<InlineStat
								label='Employees'
								value={result.employee_count}
								ready={ready}
							/>
						)}
					</div>
				</Tile>
			</Row>

			{/* Row 2: About, Industry, Profile coverage */}
			<Row count={row2}>
				{!!result.summary && (
					<Tile tone='raised' index={1} ready={ready}>
						<TileTitle tone='raised'>About</TileTitle>
						<p className='mt-auto pt-6 text-[15px] leading-7 text-fg/90'>
							{result.summary}
						</p>
					</Tile>
				)}

				{!!result.industry && (
					<Tile index={2} ready={ready}>
						<TileTitle
							right={<LuBuilding2 className='size-4 text-subtle' aria-hidden='true' />}
						>
							Industry
						</TileTitle>
						<p className='mt-auto line-clamp-4 pt-6 text-3xl font-semibold leading-tight tracking-[-0.03em] text-fg'>
							{result.industry}
						</p>
					</Tile>
				)}

				<Tile index={3} ready={ready}>
					<TileTitle>Profile coverage</TileTitle>
					<div className='my-auto py-4'>
						<Ring value={found} max={coverage.length} ready={ready} />
						<div className='mt-5 flex justify-center gap-2'>
							{coverage.map((field) => (
								<span
									key={field.label}
									title={`${field.label}: ${field.ok ? 'found' : 'not found'}`}
									className={`size-1.5 rounded-full ${
										field.ok ? 'bg-fg' : 'bg-line-strong'
									}`}
								/>
							))}
						</div>
					</div>
				</Tile>
			</Row>

			{/* Row 3: Email, Phone, Social */}
			<Row count={row3}>
				{emails.length > 0 && (
					<ContactTile
						icon={LuMail}
						label='Email'
						count={emails.length}
						max={channelMax}
						index={4}
						ready={ready}
					>
						<ExpandableList
							items={emails}
							renderItem={(email) => (
								<li key={email}>
									<a href={`mailto:${email}`} className={contactLink}>
										{email}
									</a>
								</li>
							)}
						/>
					</ContactTile>
				)}

				{phones.length > 0 && (
					<ContactTile
						icon={LuPhone}
						label='Phone'
						count={phones.length}
						max={channelMax}
						index={5}
						ready={ready}
					>
						<ExpandableList
							items={phones}
							renderItem={(phone) => (
								<li key={phone}>
									<a href={phoneHref(phone)} className={contactLink}>
										{phone}
									</a>
								</li>
							)}
						/>
					</ContactTile>
				)}

				{socials.length > 0 && (
					<ContactTile
						icon={LuGlobe}
						label='Social'
						count={socials.length}
						max={channelMax}
						index={6}
						ready={ready}
					>
						<ExpandableList
							items={socials}
							renderItem={(url) => (
								<li key={url}>
									<ExternalLink href={url}>{platformLabel(url)}</ExternalLink>
								</li>
							)}
						/>
					</ContactTile>
				)}
			</Row>

			{/* Row 4: Products and services */}
			<Row count={services.length > 0 ? 1 : 0}>
				<Tile index={7} ready={ready}>
					<TileTitle right={<CountBadge>{services.length}</CountBadge>}>
						Products and services
					</TileTitle>
					<ul className='mt-5 flex flex-wrap gap-2.5'>
						{services.map((service) => (
							<li
								key={service}
								className='rounded-full border border-line-strong bg-surface-2 px-3.5 py-1.5 text-[13px] text-fg/90'
							>
								{service}
							</li>
						))}
					</ul>
				</Tile>
			</Row>

			{/* Row 5: Offices, Careers */}
			<Row count={row5}>
				{offices.length > 0 && (
					<Tile index={8} ready={ready}>
						<TileTitle right={<CountBadge>{offices.length}</CountBadge>}>
							Offices
						</TileTitle>
						<ul className='mt-5 space-y-3.5 text-sm'>
							{offices.map((office) => (
								<li key={office} className='flex items-start gap-3 text-fg/90'>
									<LuMapPin
										className='mt-0.5 size-4 shrink-0 text-subtle'
										aria-hidden='true'
									/>
									{office}
								</li>
							))}
						</ul>
					</Tile>
				)}

				{hasCareers && (
					<Tile index={9} ready={ready}>
						<TileTitle
							right={
								jobs.length > 0 ? (
									<CountBadge>
										{jobs.length} open {jobs.length === 1 ? 'role' : 'roles'}
									</CountBadge>
								) : (
									<LuBriefcase className='size-4 text-subtle' aria-hidden='true' />
								)
							}
						>
							Careers
						</TileTitle>

						<div className='mt-5'>
							{jobs.length > 0 ? (
								<ExpandableList
									items={jobs}
									limit={4}
									listClassName='divide-y divide-line'
									renderItem={(job, index) => (
										<li
											key={`${job.title}-${index}`}
											className='flex items-center justify-between gap-4 py-3.5 first:pt-0'
										>
											<div className='min-w-0'>
												<p className='truncate text-[15px] font-medium text-fg'>
													{job.title}
												</p>
												{job.location && (
													<p className='mt-1 flex items-center gap-1.5 text-[13px] text-muted'>
														<LuMapPin className='size-3.5 text-subtle' aria-hidden='true' />
														{job.location}
													</p>
												)}
											</div>
											{job.url && (
												<ExternalLink
													href={job.url}
													className='shrink-0 rounded-xl border border-line-strong px-3.5 py-1.5 text-[13px] !text-fg hover:!bg-surface-3 hover:!no-underline'
												>
													Apply
												</ExternalLink>
											)}
										</li>
									)}
								/>
							) : (
								<p className='text-sm text-muted'>
									No open roles were found automatically.
								</p>
							)}
						</div>

						{result.careers_url && (
							<div className='mt-auto pt-6 text-sm'>
								<ExternalLink href={result.careers_url}>
									Open the careers page
								</ExternalLink>
							</div>
						)}
					</Tile>
				)}
			</Row>

			{/* Row 6: Pages we read */}
			<Row count={sources.length > 0 ? 1 : 0}>
				<Tile index={10} ready={ready}>
					<TileTitle right={<CountBadge>{sources.length}</CountBadge>}>
						Pages we read
					</TileTitle>
					<div className='mt-5'>
						<ExpandableList
							items={sources}
							limit={6}
							listClassName='grid gap-3 text-sm sm:grid-cols-2'
							renderItem={(source) => (
								<li key={source.url} className='min-w-0'>
									<ExternalLink href={source.url} className='break-all text-sm'>
										{source.title || hostOf(source.url)}
									</ExternalLink>
								</li>
							)}
						/>
					</div>
				</Tile>
			</Row>

			<p className='max-w-3xl pt-3 text-[13px] leading-relaxed text-subtle'>
				This information is gathered automatically from the company website and
				public records. Check important details before you apply.
			</p>
		</div>
	);
}

/* ---------- Page ---------- */

export function Dashboard() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const domain = normalizeDomain(params.get('domain') ?? '');

	const [state, setState] = useState({ status: 'loading' });
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		if (!domain) return;

		let active = true;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setState({ status: 'loading' });

		researchCompany(domain, { force: attempt > 0 })
			.then(({ data, message, cached }) => {
				if (!active) return;

				setState({ status: 'success', data });
				if (!cached && message) notify.success(message);
			})
			.catch((error) => {
				if (!active) return;

				if (error.status === 401) {
					logoutUser();
					notify.error('Your session expired. Please sign in again.');
					navigate('/login', { replace: true });
					return;
				}

				setState({ status: 'error', message: error.message });
				notify.apiError(error);
			});

		return () => {
			active = false;
		};
	}, [domain, attempt, navigate]);

	if (!domain) return <Navigate to='/' replace />;

	const retry = () => setAttempt((count) => count + 1);

	return (
		<div className='relative isolate min-h-dvh bg-canvas text-fg'>
			<Navbar />

			<main className='relative mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-8 lg:px-10'>
				<Link
					to='/'
					className='mb-6 inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface/70 px-3.5 py-2 text-[13px] text-fg backdrop-blur-xl transition duration-200 hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-hover'
				>
					<LuArrowLeft className='size-4 text-muted' aria-hidden='true' />
					New search
				</Link>

				{state.status === 'loading' && <Skeleton domain={domain} />}

				{state.status === 'error' && (
					<div
						role='alert'
						className='max-w-2xl rounded-card border border-danger/30 bg-danger/10 p-7'
					>
						<div className='flex items-start gap-4'>
							<LuTriangleAlert
								className='mt-0.5 size-5 shrink-0 text-danger'
								aria-hidden='true'
							/>
							<div className='min-w-0 flex-1'>
								<h1 className='text-lg font-semibold tracking-tight text-fg'>
									We could not research {domain}
								</h1>
								<p className='mt-1.5 text-sm leading-relaxed text-muted'>
									{state.message}
								</p>

								<div className='mt-6 flex flex-wrap gap-3'>
									<button
										type='button'
										onClick={retry}
										className='inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-fg transition duration-200 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-hover active:scale-[0.98]'
									>
										<LuRefreshCw className='size-3.5' aria-hidden='true' />
										Try again
									</button>
									<Link
										to='/'
										className='inline-flex items-center rounded-xl border border-line-strong px-5 py-2.5 text-sm text-fg transition duration-200 hover:bg-surface-3'
									>
										Search another domain
									</Link>
								</div>
							</div>
						</div>
					</div>
				)}

				{state.status === 'success' && (
					<CompanyProfileView data={state.data} onRefresh={retry} />
				)}
			</main>
		</div>
	);
}

export default Dashboard;
