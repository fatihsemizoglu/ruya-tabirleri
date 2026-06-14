import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      expand
      visibleToasts={4}
      duration={4500}
      mobileOffset={16}
      toastOptions={{
        classNames: {
          toast:
            "group toast app-toast-surface group-[.toaster]:text-foreground",
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted/70 group-[.toast]:text-foreground group-[.toast]:border-border/40",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
