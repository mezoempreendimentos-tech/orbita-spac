import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import LocalLoginDialog from "./components/LocalLoginDialog";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Home />
          {/* Modal global de login local: escuta o evento `orbita:open-login`
              e abre sobre qualquer tela, sem redirecionar para `/login`.
              Substitui a página LocalLogin separada. */}
          <LocalLoginDialog />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
