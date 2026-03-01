import {
    createContext,
    useCallback,
    useContext,
    useState,
    useRef,
    useEffect,
    type ReactNode,
} from 'react';
import * as Toast from '@radix-ui/react-toast';
import { cn } from '../../lib/utils';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

// ---------- Types ----------

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
    id: string;
    title: string;
    description?: string;
    variant: ToastVariant;
    duration?: number;
}

interface ToastContextValue {
    toast: (item: Omit<ToastItem, 'id'>) => void;
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ---------- Variant config ----------

const variantConfig: Record<
    ToastVariant,
    { border: string; icon: typeof Check; iconColor: string }
> = {
    success: {
        border: 'border-l-[3px] border-l-commons-success',
        icon: Check,
        iconColor: 'text-commons-success',
    },
    error: {
        border: 'border-l-[3px] border-l-commons-error',
        icon: X,
        iconColor: 'text-commons-error',
    },
    warning: {
        border: 'border-l-[3px] border-l-commons-warning',
        icon: AlertTriangle,
        iconColor: 'text-commons-warning',
    },
    info: {
        border: 'border-l-[3px] border-l-[#4A90D9]',
        icon: Info,
        iconColor: 'text-[#4A90D9]',
    },
};

// ---------- Single toast ----------

function ToastSlot({
    item,
    onDismiss,
}: {
    item: ToastItem;
    onDismiss: (id: string) => void;
}) {
    const config = variantConfig[item.variant];
    const Icon = config.icon;
    const [paused, setPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const remainingRef = useRef(item.duration ?? 4000);
    const startRef = useRef(Date.now());

    useEffect(() => {
        if (paused) {
            remainingRef.current -= Date.now() - startRef.current;
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }
        startRef.current = Date.now();
        timerRef.current = setTimeout(
            () => onDismiss(item.id),
            remainingRef.current
        );
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [paused, item.id, onDismiss]);

    return (
        <Toast.Root
            open
            onOpenChange={(open) => {
                if (!open) onDismiss(item.id);
            }}
            onPause={() => setPaused(true)}
            onResume={() => setPaused(false)}
            className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border border-commons-border bg-white p-4 shadow-sm',
                'animate-toast-in data-[state=closed]:animate-toast-out',
                config.border
            )}
        >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconColor)} />
            <div className="min-w-0 flex-1">
                <Toast.Title className="text-sm font-medium text-commons-text">
                    {item.title}
                </Toast.Title>
                {item.description && (
                    <Toast.Description className="mt-0.5 text-[13px] text-commons-textMid">
                        {item.description}
                    </Toast.Description>
                )}
            </div>
            <Toast.Close
                className="shrink-0 rounded p-1 text-commons-textLight hover:text-commons-text transition-colors"
                aria-label="Close notification"
            >
                <X className="h-3.5 w-3.5" />
            </Toast.Close>
        </Toast.Root>
    );
}

// ---------- Provider ----------

const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const queueRef = useRef<ToastItem[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => {
            const next = prev.filter((t) => t.id !== id);
            // Promote from queue
            if (queueRef.current.length > 0 && next.length < MAX_VISIBLE) {
                const promoted = queueRef.current.shift()!;
                return [...next, promoted];
            }
            return next;
        });
    }, []);

    const addToast = useCallback(
        (item: Omit<ToastItem, 'id'>) => {
            const id = crypto.randomUUID();
            const toast: ToastItem = { ...item, id };

            setToasts((prev) => {
                if (prev.length >= MAX_VISIBLE) {
                    queueRef.current.push(toast);
                    return prev;
                }
                return [...prev, toast];
            });
        },
        []
    );

    const ctx: ToastContextValue = {
        toast: addToast,
        success: (title, description) =>
            addToast({ title, description, variant: 'success' }),
        error: (title, description) =>
            addToast({ title, description, variant: 'error' }),
        warning: (title, description) =>
            addToast({ title, description, variant: 'warning' }),
        info: (title, description) =>
            addToast({ title, description, variant: 'info' }),
    };

    return (
        <ToastContext.Provider value={ctx}>
            <Toast.Provider swipeDirection="right" duration={Infinity}>
                {children}
                {toasts.map((t) => (
                    <ToastSlot key={t.id} item={t} onDismiss={dismiss} />
                ))}
                <Toast.Viewport className="fixed bottom-6 right-6 z-[100] flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2" />
            </Toast.Provider>
        </ToastContext.Provider>
    );
}

// ---------- Hook ----------

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return ctx;
}
