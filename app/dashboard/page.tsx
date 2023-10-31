import Cards from '@/app/ui/dashboard/cards';
import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import { lusitana } from '@/app/ui/fonts';
import { fetchCustomers, fetchLatestInvoices, fetchRevenue } from '../lib/data';
import { Suspense } from 'react';
import { CardsSkeleton } from '../ui/skeletons';

interface Revenue {
  month: string;
  revenue: number;
};

interface LatestInvoice {
  id: string;
  name: string;
  image_url: string;
  email: string;
  amount: string;
};


export default async function Page() {
  const revenue: Revenue[] | any = await fetchRevenue();
  const latestInvoices : LatestInvoice[] | any = await fetchLatestInvoices();
  
  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardsSkeleton />}>
          <Cards />
        </Suspense>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <RevenueChart revenue={revenue}  />
        <LatestInvoices latestInvoices={latestInvoices} />
      </div>
    </main>
  );
}