import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { playNotificationSound } from "@/lib/sounds";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:!bg-background/60 group-[.toaster]:!backdrop-blur-md group-[.toaster]:!text-foreground group-[.toaster]:!border-border/50 group-[.toaster]:!shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:!bg-background/60 group-[.toaster]:!backdrop-blur-md group-[.toaster]:!border-border/50 group-[.toaster]:!text-foreground",
          error: "group-[.toaster]:!bg-destructive/10 group-[.toaster]:!backdrop-blur-md group-[.toaster]:!border-destructive/50 group-[.toaster]:!text-destructive",
          warning: "group-[.toaster]:!bg-background/60 group-[.toaster]:!backdrop-blur-md group-[.toaster]:!border-border/50 group-[.toaster]:!text-foreground",
          info: "group-[.toaster]:!bg-background/60 group-[.toaster]:!backdrop-blur-md group-[.toaster]:!border-border/50 group-[.toaster]:!text-foreground",
        },
      }}
      {...props}
    />
  );
};

const playSound = () => {
  const soundPref = localStorage.getItem('sadma_sound') as any || 'pop';
  playNotificationSound(soundPref);
  
  // Provide haptic feedback on supported mobile devices
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(50);
  }
};

const toast = Object.assign(
  (message: string | React.ReactNode, data?: any) => {
    playSound();
    return sonnerToast(message, data);
  },
  {
    success: (message: string | React.ReactNode, data?: any) => {
      playSound();
      return sonnerToast.success(message, data);
    },
    error: (message: string | React.ReactNode, data?: any) => {
      playSound();
      return sonnerToast.error(message, data);
    },
    info: (message: string | React.ReactNode, data?: any) => {
      playSound();
      return sonnerToast.info(message, data);
    },
    warning: (message: string | React.ReactNode, data?: any) => {
      playSound();
      return sonnerToast.warning(message, data);
    },
    loading: (message: string | React.ReactNode, data?: any) => {
      // Don't play sound for loading start usually, or maybe play a subtle one
      return sonnerToast.loading(message, data);
    },
    dismiss: sonnerToast.dismiss,
    promise: sonnerToast.promise,
    custom: (jsx: any, data?: any) => {
      playSound();
      return sonnerToast.custom(jsx, data);
    }
  }
);

export { Toaster, toast };
