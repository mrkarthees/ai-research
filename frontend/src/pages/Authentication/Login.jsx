import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LuEye, LuEyeOff, LuLoader } from 'react-icons/lu';

import { isAuthenticated, loginUser } from '../../api/auth';
import { notify } from '../../utils/toast';
import bannerImage from '../../assets/banner.webp';

const validate = ({ email, password }) => {
	const errors = {};

	if (!/^\S+@\S+\.\S+$/.test(email.trim()))
		errors.email = 'Enter a valid email address.';
	if (!password) errors.password = 'Enter your password.';

	return errors;
};

export function Login() {
	const navigate = useNavigate();

	const [form, setForm] = useState({ email: '', password: '' });
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	if (isAuthenticated()) return <Navigate to='/' replace />;

	const handleChange = ({ target: { name, value } }) => {
		setForm((current) => ({ ...current, [name]: value }));
		setErrors((current) => ({ ...current, [name]: undefined }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		const found = validate(form);
		setErrors(found);

		if (Object.keys(found).length > 0) return;

		setLoading(true);

		try {
			const message = await loginUser({
				email: form.email.trim(),
				password: form.password,
			});

			notify.success(message);
			navigate('/', { replace: true });
		} catch (err) {
			notify.apiError(err);
			setLoading(false);
		}
	};

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
						Sign in
					</h1>
					<p className='text-xs sm:text-sm text-slate-400 leading-relaxed'>
						Welcome back. Enter your credentials to continue.
					</p>

					<form onSubmit={handleSubmit} noValidate className='mt-8 space-y-4'>
						{/* Email Field */}
						<div>
							<label
								htmlFor='email'
								className='mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400'
							>
								Your email
							</label>
							<input
								id='email'
								name='email'
								type='email'
								autoComplete='email'
								placeholder='you@example.com'
								value={form.email}
								onChange={handleChange}
								className={`w-full rounded-xl border bg-[#141518] px-4 py-3 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 ${
									errors.email
										? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
										: 'border-white/[0.08] hover:border-white/[0.16] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25'
								}`}
							/>
							{errors.email && (
								<p className='mt-1.5 text-xs text-rose-400'>{errors.email}</p>
							)}
						</div>

						{/* Password Field */}
						<div>
							<label
								htmlFor='password'
								className='mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400'
							>
								Password
							</label>
							<div className='relative'>
								<input
									id='password'
									name='password'
									type={showPassword ? 'text' : 'password'}
									autoComplete='current-password'
									placeholder='Your password'
									value={form.password}
									onChange={handleChange}
									className={`w-full rounded-xl border bg-[#141518] px-4 py-3 pr-11 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 ${
										errors.password
											? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
											: 'border-white/[0.08] hover:border-white/[0.16] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25'
									}`}
								/>
								<button
									type='button'
									onClick={() => setShowPassword((p) => !p)}
									className='absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500 hover:text-slate-200'
									tabIndex={-1}
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? <LuEyeOff size={16} /> : <LuEye size={16} />}
								</button>
							</div>
							{errors.password && (
								<p className='mt-1.5 text-xs text-rose-400'>{errors.password}</p>
							)}
						</div>

						{/* Submit button */}
						<button
							type='submit'
							disabled={loading}
							className='flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_18px_rgba(37,99,235,0.35)] transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_4px_24px_rgba(37,99,235,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]'
						>
							{loading && <LuLoader className='size-4 animate-spin' />}
							{loading ? 'Signing in...' : 'Sign in'}
						</button>
					</form>

					<p className='mt-8 text-center text-xs text-slate-400'>
						Don&apos;t have an account?{' '}
						<Link
							to='/signup'
							className='font-semibold text-blue-400 transition-colors hover:text-blue-300 hover:underline'
						>
							Sign up
						</Link>
					</p>
				</div>

				<div className='relative z-10 text-center text-[11px] text-slate-600'>
					© {new Date().getFullYear()} Research Flow. All rights reserved.
				</div>
			</main>

			{/* Right Banner Hero Panel on desktop */}
			<aside className='relative hidden overflow-hidden border-l border-white/[0.06] lg:sticky lg:top-0 lg:block lg:h-dvh'>
				{/* Background image from assets/banner.webp */}
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

					{/* Sample preview card */}
					<div className='w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#121316]/90 p-6 shadow-2xl backdrop-blur-xl'>
						<div className='flex items-center justify-between mb-5'>
							<div className='flex items-center gap-3.5'>
								<div className='flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-[0_0_16px_rgba(37,99,235,0.4)]'>
									S
								</div>
								<div>
									<p className='text-sm font-bold text-white'>stripe.com</p>
									<p className='text-xs text-slate-400'>Financial Infrastructure</p>
								</div>
							</div>
							<span className='rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400'>
								Active Profile
							</span>
						</div>

						<hr className='border-white/[0.06] mb-4' />

						<dl className='divide-y divide-white/[0.05] text-xs'>
							<div className='flex justify-between py-2'>
								<dt className='font-semibold uppercase tracking-wider text-slate-400'>
									Headcount
								</dt>
								<dd className='font-medium text-slate-100'>5,000+ employees</dd>
							</div>
							<div className='flex justify-between py-2'>
								<dt className='font-semibold uppercase tracking-wider text-slate-400'>
									Locations
								</dt>
								<dd className='font-medium text-slate-100'>14 global offices</dd>
							</div>
							<div className='flex justify-between py-2'>
								<dt className='font-semibold uppercase tracking-wider text-slate-400'>
									Active Roles
								</dt>
								<dd className='font-medium text-slate-100'>38 open positions</dd>
							</div>
						</dl>
					</div>
				</div>
			</aside>
		</div>
	);
}

export default Login;
