import { ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppBreadcrumb from "@/components/AppBreadcrumb";

type PublicLayoutProps = {
  children: ReactNode;
};

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <AppBreadcrumb />
      </div>
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
