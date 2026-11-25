const Bone = ({ className = '', style }) => (
	<div
		className={`animate-pulse rounded-md bg-surface-3 motion-reduce:animate-none ${className}`}
		style={style}
	/>
);

const Tile = ({ children, className = '' }) => (
	<div
		className={`flex flex-col rounded-card border border-line bg-surface p-5 sm:p-6 ${className}`}
	>
		{children}
	</div>
);

// Mirrors the bento layout of Dashboard so nothing shifts when data arrives.
export function Skeleton({ domain }) {
	return (
		<div role='status' aria-live='polite' className='space-y-6'>
			<p className='flex items-center gap-2.5 text-[13px] text-muted'>
				<span className='size-2 animate-ping rounded-full bg-accent motion-reduce:animate-none' />
				<span>
					Analyzing <span className='text-accent-hover'>{domain}</span>, pulling
					together the company profile
				</span>
			</p>
			<span className='sr-only'>Loading results for {domain}</span>

			<div className='space-y-3'>
				{/* Row 1: Company */}
				<Tile className='min-h-40'>
					<div className='space-y-3'>
						<Bone className='h-9 w-64 max-w-full' />
						<Bone className='h-4 w-40' />
						<Bone className='h-4 w-28' />
					</div>
					<div className='mt-auto flex flex-wrap items-end justify-between gap-6 pt-10'>
						<div className='flex gap-3'>
							<Bone className='h-11 w-36 rounded-xl' />
							<Bone className='h-11 w-28 rounded-xl' />
						</div>
						<div className='space-y-2'>
							<Bone className='h-3.5 w-16' />
							<Bone className='h-7 w-20' />
						</div>
					</div>
				</Tile>

				{/* Row 2: About, Industry, Profile coverage */}
				<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
					<Tile className='min-h-40'>
						<Bone className='h-3.5 w-16' />
						<div className='mt-auto space-y-2.5 pt-6'>
							<Bone className='h-4 w-full' />
							<Bone className='h-4 w-11/12' />
							<Bone className='h-4 w-4/5' />
						</div>
					</Tile>
					<Tile className='min-h-40'>
						<Bone className='h-3.5 w-16' />
						<div className='mt-auto space-y-2 pt-6'>
							<Bone className='h-8 w-full' />
							<Bone className='h-8 w-2/3' />
						</div>
					</Tile>
					<Tile className='min-h-40'>
						<Bone className='h-3.5 w-28' />
						<div className='my-auto py-4'>
							<Bone className='mx-auto size-44 rounded-full' />
							<div className='mt-5 flex justify-center gap-2'>
								{[0, 1, 2, 3, 4, 5, 6, 7].map((dot) => (
									<Bone key={dot} className='size-1.5 rounded-full' />
								))}
							</div>
						</div>
					</Tile>
				</div>

				{/* Row 3: Email, Phone, Social */}
				<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
					{[0, 1, 2].map((item) => (
						<Tile key={item}>
							<div className='flex items-center justify-between'>
								<Bone className='h-3.5 w-14' />
								<Bone className='size-4' />
							</div>
							<div className='mt-4 space-y-2.5'>
								<div className='flex items-baseline justify-between'>
									<Bone className='h-8 w-8' />
									<Bone className='h-3.5 w-10' />
								</div>
								<Bone className='h-1 w-full rounded-full' />
							</div>
							<div className='mt-5 space-y-3'>
								<Bone className='h-4 w-full' />
								<Bone className='h-4 w-4/5' />
							</div>
						</Tile>
					))}
				</div>

				{/* Row 4: Products and services */}
				<Tile>
					<Bone className='h-3.5 w-36' />
					<div className='mt-5 flex flex-wrap gap-2.5'>
						{[88, 112, 96, 128, 76, 104, 120].map((width, index) => (
							<Bone key={index} className='h-8 rounded-full' style={{ width }} />
						))}
					</div>
				</Tile>

				{/* Row 5: Offices, Careers */}
				<div className='grid gap-3 sm:grid-cols-2'>
					<Tile className='min-h-40'>
						<Bone className='h-3.5 w-16' />
						<div className='mt-5 space-y-3.5'>
							{[0, 1, 2].map((item) => (
								<div key={item} className='flex items-center gap-3'>
									<Bone className='size-4 shrink-0' />
									<Bone className='h-4 w-full' />
								</div>
							))}
						</div>
					</Tile>
					<Tile className='min-h-40'>
						<div className='flex items-center justify-between'>
							<Bone className='h-3.5 w-20' />
							<Bone className='h-5 w-24 rounded-full' />
						</div>
						<div className='mt-5 space-y-4'>
							{[0, 1].map((item) => (
								<div key={item} className='flex items-center justify-between gap-4'>
									<div className='space-y-2'>
										<Bone className='h-4 w-40' />
										<Bone className='h-3 w-24' />
									</div>
									<Bone className='h-8 w-16 rounded-xl' />
								</div>
							))}
						</div>
					</Tile>
				</div>

				{/* Row 6: Pages we read */}
				<Tile>
					<Bone className='h-3.5 w-28' />
					<div className='mt-5 grid gap-3 sm:grid-cols-2'>
						<Bone className='h-4 w-full' />
						<Bone className='h-4 w-5/6' />
						<Bone className='h-4 w-2/3' />
						<Bone className='h-4 w-3/4' />
					</div>
				</Tile>
			</div>
		</div>
	);
}

export default Skeleton;
