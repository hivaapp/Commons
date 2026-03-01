import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-commons-bg px-6 text-center">
            <p className="text-[80px] font-black leading-none text-commons-border">404</p>
            <h2 className="mt-4 text-xl font-bold text-commons-text">Page not found</h2>
            <p className="mt-1 text-sm text-commons-textMid">
                The page you're looking for doesn't exist.
            </p>
            <Link
                to="/"
                className="mt-8 text-sm font-medium text-commons-brand hover:text-commons-brandHover"
            >
                Go home
            </Link>
        </div>
    );
}
