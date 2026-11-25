import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LuEye, LuEyeOff, LuLoader } from 'react-icons/lu';

import { isAuthenticated, registerUser } from '../../api/auth';
import { notify } from '../../utils/toast';
import bannerImage from '../../assets/banner.webp';

const EMPTY_FORM = {
	name: '',
	email: '',
	username: '',
	phone_number: '',
	age: '',
	password: '',
	confirmPassword: '',
};

const validate = (form) => {
	const errors = {};

	if (!form.name.trim()) errors.name = 'Enter your full name.';
	if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
		errors.email = 'Enter a valid email address.';
	if (form.age && (Number(form.age) < 16 || Number(form.age) > 100))
		errors.age = 'Enter an age between 16 and 100.';
	if (form.password.length < 8) errors.password = 'Use at least 8 characters.';
	if (form.confirmPassword !== form.password)
		errors.confirmPassword = 'Passwords do not match.';

	return errors;
};

const fieldForMessage = (message) =>
	/email/i.test(message)
		? 'email'
		: /username/i.test(message)
			? 'username'
			: null;

export function Signup() {
	const navigate = useNavigate();

	const [form, setForm] = useState(EMPTY_FORM);
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

		const payload = {
			name: form.name.trim(),
			email: form.email.trim(),
			password: form.password,
			...(form.username.trim() && { username: form.username.trim() }),
			...(form.phone_number.trim() && { phone_number: form.phone_number.trim() }),
			...(form.age && { age: Number(form.age) }),
		};

		setLoading(true);

		try {
			const successMessage = await registerUser(payload);
			notify.success(successMessage);
			navigate('/login', { replace: true });
		} catch (err) {
			const field = fieldForMessage(err.message);

			if (field) setErrors({ [field]: err.message });

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

				<div className='relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8'>
					<h1 className='text-2xl font-bold tracking-tight text-white mb-1.5'>
						Create your account
					</h1>
					<p className='text-xs sm:text-sm text-slate-400 leading-relaxed'>
						Start researching companies in seconds.
					</p>

					<form onSubmit={handleSubmit} noValidate className='mt-6 space-y-3.5'>
						{/* Full Name */}
						<div>
							<label
								htmlFor='name'
								className='mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400'
							>
								Full name
							</label>
							<input
								id='name'
								name='name'
								type='text'
								autoComplete='name'
								placeholder='Your full name'
								value={form.name}
								onChange={handleChange}
								className={`w-full rounded-xl border bg-[#141518] px-4 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 ${
									errors.name
										? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
										: 'border-white/[0.08] hover:border-white/[0.16] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25'
								}`}
							/>
							{errors.name && (
								<p className='mt-1 text-xs text-rose-400'>{errors.name}</p>
							)}
						</div>

						{/* Email */}
						<div>
							<label
								htmlFor='email'
								className='mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400'
							>
								Email
							</label>
							<input
								id='email'
								name='email'
								type='email'
								autoComplete='email'
								placeholder='you@example.com'
								value={form.email}
								onChange={handleChange}
								className={`w-full rounded-xl border bg-[#141518] px-4 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 ${
									errors.email
										? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
										: 'border-white/[0.08] hover:border-white/[0.16] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25'
								}`}
							/>
							{errors.email && (
								<p className='mt-1 text-xs text-rose-400'>{errors.email}</p>
							)}
						</div>

						{/* Username */}
						<div>
							<label
								htmlFor='username'
								className='mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400'
							>
								Username (optional)
							</label>
							<input
								id='username'
								name='username'
								type='text'
								autoComplete='username'
								placeholder='Choose a username'
								value={form.username}
								onChange={handleChange}
								className='w-full rounded-xl border border-white/[0.08] bg-[#141518] px-4 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 hover:border-white/[0.16] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25'
							/>
						</div>

						{/* Phone & Age */}
						<div className='grid gap-3 sm:grid-cols-2'>
							<div>
								<label
									htmlFor='phone_number'
									className='mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400'
								>
									Phone (optional)
								</label>
								<input
									id='phone_number'
									name='phone_number'
									type='tel'
									autoComplete='tel'
									placeholder='Phone'
									value={form.phone_number}
									onChange={handleChange}
									className='w-full rounded-xl border border-white/[0.08] bg-[#141518] px-4 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 hover:border-white/[0.16] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25'
								/>
							</div>
							<div>
								<label
									htmlFor='age'
									className='mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400'
								>
									Age (optional)
								</label>
								<input
									id='age'
									name='age'
									type='number'
									min='16'
									max='100'
									placeholder='Age'
									value={form.age}
									onChange={handleChange}
									className={`w-full rounded-xl border bg-[#141518] px-4 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 ${
										errors.age
											? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
											: 'border-white/[0.08] hover:border-white/[0.16] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25'
									}`}
								/>
							</div>
						</div>

						{/* Password */}
						<div>
							<label
								htmlFor='password'
								className='mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400'
							>
								Password
							</label>
							<div className='relative'>
								<input
									id='password'
									name='password'
									type={showPassword ? 'text' : 'password'}
									autoComplete='new-password'
									placeholder='At least 8 characters'
									value={form.password}
									onChange={handleChange}
									className={`w-full rounded-xl border bg-[#141518] px-4 py-2.5 pr-11 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 ${
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
								<p className='mt-1 text-xs text-rose-400'>{errors.password}</p>
							)}
						</div>

						{/* Confirm Password */}
						<div>
							<label
								htmlFor='confirmPassword'
								className='mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400'
							>
								Confirm password
							</label>
							<input
								id='confirmPassword'
								name='confirmPassword'
								type='password'
								autoComplete='new-password'
								placeholder='Repeat your password'
								value={form.confirmPassword}
								onChange={handleChange}
								className={`w-full rounded-xl border bg-[#141518] px-4 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 ${
									errors.confirmPassword
										? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
										: 'border-white/[0.08] hover:border-white/[0.16] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25'
								}`}
							/>
							{errors.confirmPassword && (
								<p className='mt-1 text-xs text-rose-400'>
									{errors.confirmPassword}
								</p>
							)}
						</div>

						{/* Submit button */}
						<button
							type='submit'
							disabled={loading}
							className='mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_18px_rgba(37,99,235,0.35)] transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_4px_24px_rgba(37,99,235,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]'
						>
							{loading && <LuLoader className='size-4 animate-spin' />}
							{loading ? 'Creating account...' : 'Create account'}
						</button>
					</form>

					<p className='mt-6 text-center text-xs text-slate-400'>
						Already have an account?{' '}
						<Link
							to='/login'
							className='font-semibold text-blue-400 transition-colors hover:text-blue-300 hover:underline'
						>
							Sign in
						</Link>
					</p>
				</div>

				<div className='relative z-10 text-center text-[11px] text-slate-600'>
					© {new Date().getFullYear()} Research Flow. All rights reserved.
				</div>
			</main>

			{/* Right Banner Hero Panel on desktop */}
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
							Join thousands of <br /> smart job applicants.
						</h2>
						<p className='mt-3 text-xs sm:text-sm text-slate-400'>
							Research before applying. Uncover authentic team metrics and verified open
							roles in one click.
						</p>
					</div>
				</div>
			</aside>
		</div>
	);
}

export default Signup;
