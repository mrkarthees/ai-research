import { useEffect, useState } from 'react';
import { LuCheck, LuX } from 'react-icons/lu';
import { dismissToast, subscribeToasts } from '../utils/toast';

/**
 * Minimal Pill-Shaped Toast Notification item.
 * Features icon on the left, message on the right, smooth slide-up and fade-out animations.
 */
function ToastItem({ item, onDismiss }) {
	const isSuccess = item.type === 'success';
	const showBoth =
		item.title &&
		item.message &&
		item.title.toLowerCase() !== item.message.toLowerCase();

	return (
		<div
			role='status'
			aria-live='polite'
			onClick={onDismiss}
			className={`pointer-events-auto inline-flex cursor-pointer items-center gap-2.5 rounded-full border px-4 py-2 sm:px-5 sm:py-2.5 shadow-2xl backdrop-blur-md transition-all select-none ${
				item.dismissing ? 'pill-toast-exit' : 'pill-toast-enter'
			} ${
				isSuccess
					? 'border-emerald-500/25 bg-[#121417]/95 text-white shadow-[0_10px_32px_rgba(0,0,0,0.7),0_0_15px_rgba(16,185,129,0.15)] hover:border-emerald-500/40'
					: 'border-rose-500/25 bg-[#171214]/95 text-white shadow-[0_10px_32px_rgba(0,0,0,0.7),0_0_15px_rgba(244,63,94,0.15)] hover:border-rose-500/40'
			}`}
		>
			{/* Icon on left: green circle with checkmark, or red with cross */}
			<div
				className={`flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
					isSuccess
						? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.45)]'
						: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.45)]'
				}`}
			>
				{isSuccess ? (
					<LuCheck className='size-3 sm:size-3.5 stroke-[3]' aria-hidden='true' />
				) : (
					<LuX className='size-3 sm:size-3.5 stroke-[3]' aria-hidden='true' />
				)}
			</div>

			{/* Message on right: short label or descriptive text */}
			<div className='flex items-center text-xs sm:text-sm whitespace-nowrap leading-none'>
				{showBoth ? (
					<>
						<span className='font-bold text-white'>{item.title}</span>
						<span className='mx-1.5 text-slate-500 font-normal'>•</span>
						<span className='font-medium text-slate-200'>{item.message}</span>
					</>
				) : (
					<span className='font-semibold text-white tracking-wide'>
						{item.message || item.title}
					</span>
				)}
			</div>
		</div>
	);
}

/**
 * Reusable Global Toast Notification Component.
 * Minimal, pill-shaped notification at the bottom-center of the screen.
 */
export function Toast() {
	const [activeToasts, setActiveToasts] = useState([]);

	useEffect(() => {
		const unsubscribe = subscribeToasts((list) => {
			setActiveToasts(list);
		});
		return unsubscribe;
	}, []);

	if (activeToasts.length === 0) return null;

	return (
		<div
			className='fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none flex flex-col items-center gap-2 px-4 w-full max-w-max'
			aria-live='polite'
		>
			{activeToasts.map((item) => (
				<ToastItem
					key={item.id}
					item={item}
					onDismiss={() => dismissToast(item.id)}
				/>
			))}
		</div>
	);
}

export default Toast;
