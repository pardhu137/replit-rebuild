import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/lib/context";
import AreasListPage from "./pages/AreasListPage";
import AreaDetailPage from "./pages/AreaDetailPage";
import CreateAreaPage from "./pages/CreateAreaPage";
import CreateVillagePage from "./pages/CreateVillagePage";
import CreateCustomerPage from "./pages/CreateCustomerPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import PaymentPage from "./pages/PaymentPage";
import RenewLoanPage from "./pages/RenewLoanPage";
import CreateExpensePage from "./pages/CreateExpensePage";
import CreateCapitalPage from "./pages/CreateCapitalPage";
import CreateAdjustmentPage from "./pages/CreateAdjustmentPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AreasListPage />} />
            <Route path="/area/create" element={<CreateAreaPage />} />
            <Route path="/area/:id" element={<AreaDetailPage />} />
            <Route path="/village/create" element={<CreateVillagePage />} />
            <Route path="/customer/create" element={<CreateCustomerPage />} />
            <Route path="/customer/:id" element={<CustomerDetailPage />} />
            <Route path="/payment/:customerId" element={<PaymentPage />} />
            <Route path="/loan/renew" element={<RenewLoanPage />} />
            <Route path="/expense/create" element={<CreateExpensePage />} />
            <Route path="/capital/create" element={<CreateCapitalPage />} />
            <Route path="/adjustment/create" element={<CreateAdjustmentPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
