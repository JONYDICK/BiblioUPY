import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/lib/i18n";
import NotFound from "@/pages/not-found";

// Components
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Pages
import Home from "@/pages/Home";
import Upload from "@/pages/Upload";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Resource from "@/pages/Resource";

// Forum Pages
import ForumCategories from "@/pages/forum/ForumCategories";
import ForumThreads from "@/pages/forum/ForumThreads";
import ForumThread from "@/pages/forum/ForumThread";
import CreateThread from "@/pages/forum/CreateThread";

// Routes without default header/footer
const standaloneRoutes = ["/login", "/register", "/forgot-password"];

function Router() {
  const [location] = useLocation();
  const isStandaloneRoute = standaloneRoutes.some(route => location.startsWith(route));

  if (isStandaloneRoute) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body overflow-x-hidden selection:bg-primary selection:text-background">
      <Header />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/upload" component={Upload} />
        <Route path="/profile" component={Profile} />
        <Route path="/resource/:id" component={Resource} />
        <Route path="/forum" component={ForumCategories} />
        <Route path="/forum/category/:categorySlug" component={ForumThreads} />
        <Route path="/forum/category/:categorySlug/new" component={CreateThread} />
        <Route path="/forum/thread/:threadSlug" component={ForumThread} />
        <Route component={NotFound} />
      </Switch>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Router />
        <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
