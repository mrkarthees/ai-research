import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	LuSearch,
	LuArrowRight,
	LuTrendingUp,
	LuShieldCheck,
	LuZap,
} from 'react-icons/lu';

import { Navbar } from '../components/Navbar';
import { Water } from '../components/Animations/Water';
import { normalizeDomain } from '../api/research';

const EXAMPLES = ['zoho.com', 'notion.so', 'vercel.com', 'airbnb.com'];

const HIGHLIGHTS = [
	{
		icon: LuZap,
		title: 'Instant extraction',
		desc: 'Live scraping of company details, stack, and mission.',
	},
	{
		icon: LuTrendingUp,
		title: 'Team and headcount',
		desc: 'Estimated employee size, office footprints, and growth.',
	},
	{
		icon: LuShieldCheck,
		title: 'Verified open roles',
		desc: 'Direct career links and real-time active job openings.',
	},
];

export function Home() {
	const navigate = useNavigate();
	const [domain, setDomain] = useState('');
	const [error, setError] = useState('');

	const handleChange = (value) => {
		setDomain(value);
		setError('');
	};

	const handleSubmit = (event) => {
		event.preventDefault();

		const clean = normalizeDomain(domain);

		if (!clean) {
			setError('Enter a valid domain, for example stripe.com.');
			return;
		}

		navigate(`/result?domain=${encodeURIComponent(clean)}`);
	};

	return (
		<div className='relative isolate flex min-h-dvh flex-col overflow-x-hidden bg-canvas text-fg'>
			{/* Interactive water surface (sits behind everything) */}
			<Water className='absolute inset-0 -z-20' />

			{/* Keeps the text area calm while the edges stay lively */}
			<div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(10,11,13,0.82),transparent_75%)]' />
			<div className='pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-canvas to-transparent' />

			<Navbar />

			<main className='relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:py-24'>
				<p className='mb-7 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/60 px-3.5 py-1.5 text-[13px] text-muted backdrop-blur-xl'>
					<span className='size-1.5 rounded-full bg-accent-hover' />
					AI-powered company intelligence
				</p>

				<h1 className='text-5xl font-semibold leading-[1.04] tracking-[-0.035em] text-fg sm:text-6xl md:text-7xl'>
					Enter a domain.
					<br />
					<span className='text-muted'>Get the full company profile.</span>
				</h1>

				<p className='mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg'>
					We scan the web and assemble what you need: corporate overview, headcount,
					global offices, and active job openings.
				</p>

				<form onSubmit={handleSubmit} noValidate className='mt-10 w-full max-w-2xl'>
					<label htmlFor='domain' className='sr-only'>
						Company domain
					</label>

					<div
						className={`flex w-full flex-col gap-2 rounded-[20px] border bg-surface/70 p-2 shadow-pop backdrop-blur-2xl transition duration-300 sm:flex-row ${
							error
								? 'border-danger/60 ring-4 ring-danger/15'
								: 'border-line-strong focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft'
						}`}
					>
						<div className='relative flex flex-1 items-center'>
							<LuSearch className='pointer-events-none absolute left-4 size-4 text-subtle' />
							<input
								id='domain'
								type='text'
								inputMode='url'
								autoComplete='off'
								value={domain}
								onChange={(event) => handleChange(event.target.value)}
								placeholder='Company domain, e.g. stripe.com'
								aria-invalid={!!error}
								aria-describedby={error ? 'domain-error' : undefined}
								className='w-full rounded-xl bg-transparent py-3.5 pl-11 pr-4 text-[15px] text-fg outline-none placeholder:text-subtle'
							/>
						</div>
						<button
							type='submit'
							className='group inline-flex shrink-0 items-center justify-center gap-2 rounded-[14px] bg-accent px-6 py-3.5 text-sm font-medium text-white transition duration-200 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-hover active:scale-[0.98]'
						>
							Research company
							<LuArrowRight className='size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
						</button>
					</div>
				</form>

				{error && (
					<p
						id='domain-error'
						role='alert'
						className='mt-3 flex items-center justify-center gap-1.5 text-[13px] text-danger'
					>
						<span className='size-1.5 rounded-full bg-danger' />
						{error}
					</p>
				)}

				<div className='mt-6 flex flex-wrap items-center justify-center gap-2 text-[13px]'>
					<span className='text-subtle'>Try</span>
					{EXAMPLES.map((example) => (
						<button
							key={example}
							type='button'
							onClick={() => handleChange(example)}
							className='rounded-full border border-line-strong bg-surface/60 px-3.5 py-1.5 text-muted backdrop-blur-xl transition duration-200 hover:bg-surface-3 hover:text-fg active:scale-95'
						>
							{example}
						</button>
					))}
				</div>

				<div className='mt-20 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-3'>
					{HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
						<div
							key={title}
							className='rounded-card border border-line bg-surface/60 p-5 shadow-card backdrop-blur-xl transition-colors duration-200 hover:border-line-strong hover:bg-surface-2/80'
						>
							<Icon className='size-5 text-accent-hover' />
							<h3 className='mt-4 text-[15px] font-medium tracking-tight text-fg'>
								{title}
							</h3>
							<p className='mt-1.5 text-[13px] leading-relaxed text-muted'>{desc}</p>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}

export default Home;
