import { Link } from 'react-router-dom';
import { LuLock } from 'react-icons/lu';
import bannerImage from '../../assets/banner.webp';

export function LoginRequired() {
	return (
		<div className='grid min-h-dvh bg-[#0c0d0e] text-[#f3f4f6] lg:grid-cols-2'>
			{/* Left form panel */}
			<main className='relative flex flex-col justify-between px-6 py-8 sm:px-14'>
				<div className='relative z-10'>
					<Link
						to='/'
						className='inline-flex items-center gap-2.5 transition-opacity hover:opacity-90'
					>
						<div className='grid size-7 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-[0_0_12px_rgba(37,99,235,0.35)]'>
							<svg
								width='14'
								height='14'
								viewBox='0 0 14 14'
								fill='none'
								aria-hidden='true'
							>
								<circle cx='5' cy='5' r='3' stroke='white' strokeWidth='1.5' />
								<line
									x1='7.5'
									y1='7.5'
									x2='11'
									y2='11'
									stroke='white'
									strokeWidth='1.5'
									strokeLinecap='round'
								/>
							</svg>
						</div>
						<span className='text-sm font-bold tracking-tight text-white'>
							Research Flow
						</span>
					</Link>
				</div>

				<div className='relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10'>
					<h1 className='text-2xl font-bold tracking-tight text-white mb-1.5'>
						Sign in required
					</h1>
					<p className='text-xs sm:text-sm text-slate-400 leading-relaxed mb-6'>
						You need an active account to access company research results.
					</p>

					<div
						role='alert'
						className='mb-6 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#141518] p-4 text-xs font-medium text-slate-300'
					>
						<div className='flex size-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400'>
							<LuLock className='size-4' aria-hidden='true' />
						</div>
						<p>Please sign in to your account or create a new one to continue.</p>
					</div>

					<div className='flex flex-col gap-3'>
						<Link
							to='/login'
							className='rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)] transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_4px_22px_rgba(37,99,235,0.55)]'
						>
							Sign in to account
						</Link>
						<Link
							to='/signup'
							className='rounded-xl border border-white/[0.08] bg-[#141518] py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-300 transition-all duration-200 hover:border-white/[0.18] hover:bg-[#1a1b20] hover:text-white'
						>
							Create free account
						</Link>
					</div>
				</div>

				<div className='relative z-10 text-center text-[11px] text-slate-600'>
					© {new Date().getFullYear()} Research Flow. All rights reserved.
				</div>
			</main>

			{/* Right Banner Hero Panel */}
			<aside className='relative hidden overflow-hidden border-l border-white/[0.06] lg:sticky lg:top-0 lg:block lg:h-dvh'>
				<img
					src={bannerImage}
					alt='Corporate intelligence background'
					className='absolute inset-0 size-full object-cover object-center filter brightness-[0.22] contrast-[1.1]'
				/>
				<div className='absolute inset-0 bg-gradient-to-t from-[#0c0d0e] via-[#0c0d0e]/60 to-transparent' />

				<div className='relative flex h-full flex-col items-center justify-center gap-8 p-12'>
					<div className='max-w-md text-center'>
						<div className='mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-blue-400 shadow-[0_0_16px_rgba(37,99,235,0.2)]'>
							✦ Real-Time Corporate Intelligence
						</div>
						<h2 className='text-3xl font-extrabold text-white leading-tight'>
							Know the company <br /> before you apply.
						</h2>
						<p className='mt-3 text-xs sm:text-sm text-slate-400'>
							Access deep background, verified team size, leadership, and active hiring
							trends in seconds.
						</p>
					</div>
				</div>
			</aside>
		</div>
	);
}

export default LoginRequired;
