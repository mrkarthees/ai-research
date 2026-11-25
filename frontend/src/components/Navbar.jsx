import { Link, useNavigate } from 'react-router-dom';
import { LuLogOut } from 'react-icons/lu';
import { getUser, logoutUser } from '../api/auth';
import { notify } from '../utils/toast';

/**
 * Brand logo and name.
 */
export function Brand() {
	return (
		<Link
			to='/'
			className='inline-flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-surface-3'
		>
			<div className='grid size-6 place-items-center rounded-md bg-accent'>
				<svg
					width='13'
					height='13'
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
			<span className='text-sm font-semibold tracking-tight text-fg'>
				Research Flow
			</span>
		</Link>
	);
}

/**
 * Floating, centered, compact navigation bar.
 * Sticky (not fixed), so page content never slides underneath at load.
 */
export function Navbar() {
	const navigate = useNavigate();
	const user = getUser();

	const handleLogout = () => {
		logoutUser();
		notify.success('Logged out successfully');
		navigate('/login', { replace: true });
	};

	return (
		<header className='pointer-events-none sticky top-0 z-50 flex justify-center px-4 pt-4'>
			<nav
				aria-label='Main'
				className='pointer-events-auto flex max-w-full items-center gap-4 rounded-2xl border border-line-strong bg-surface/80 p-2 shadow-pop backdrop-blur-2xl'
			>
				<Brand />

				<span className='h-5 w-px bg-line-strong' aria-hidden='true' />

				{user?.name && (
					<div
						title={user.name}
						aria-label={user.name}
						className='grid size-8 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-fg ring-1 ring-line-strong'
					>
						{user.name.charAt(0).toUpperCase()}
					</div>
				)}

				<button
					type='button'
					onClick={handleLogout}
					className='flex items-center gap-2 rounded-xl border border-line-strong px-3.5 py-2 text-[13px] text-fg transition duration-200 hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-hover active:scale-95'
				>
					<LuLogOut className='size-3.5 text-muted' />
					<span className='hidden sm:inline'>Log out</span>
				</button>
			</nav>
		</header>
	);
}

export default Navbar;
