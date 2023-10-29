import { sql } from '@vercel/postgres';
import {
  CustomerField,
  CustomersTable,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  // Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import Revenues from '@/models/revenues';
import { connectToDB } from './database';
import Customers from '@/models/customers';
import Invoices from '@/models/invoices';

export async function fetchRevenue() {
  try {
    await connectToDB();
    const data = await Revenues.find({})
    return data;
  } catch (error) {
    console.log('Database Error:', error);
    return 'Failed to fetch revenue data.'
  }
}

export async function fetchLatestInvoices() {
  try {
    await connectToDB();
    const data = await Invoices.aggregate([
      { $sort: { date: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: 'id',
          as: 'customer',
        },
      },
      // Unwind the customer subdocument
      { $unwind: '$customer' },
      {
        $project: {
          amount: 1,
          name: '$customer.name',
          image_url: '$customer.image_url',
          email: '$customer.email',
          id: 1,
        },
      },
    ])

    return data;
  } catch (error) {
    console.log('Database Error:', error);
    return 'Failed to fetch revenue data.'
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    await connectToDB();
    const invoiceCountPromise = Invoices.count();
    const customerCountPromise = Customers.count();
    const invoiceStatusPromise = Invoices.aggregate([
      // Group the invoices by status and sum the amount for each group
      {
        $group: {
          _id: '$status',
          amount: {
            $sum: '$amount',
          },
        },
      },
      // Project the desired fields
      {
        $project: {
          paid: {
            $cond: {
              if: { $eq: ['$_id', 'paid'] },
              then: '$amount',
              else: 0,
            },
          },
          pending: {
            $cond: {
              if: { $eq: ['$_id', 'pending'] },
              then: '$amount',
              else: 0,
            },
          },
        },
      },
    ])

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);
    const numberOfInvoices = Number(data?.[0] ?? '0');
    const numberOfCustomers = Number(data?.[1] ?? '0');
    const totalPaidInvoices = formatCurrency(data?.[2]?.[0]?.paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2]?.[0]?.pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
      customerCountPromise,
    };
  } catch (error) {
    console.log('Database Error:', error);
    return { error: 'Failed to card data.' };
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  await connectToDB();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await Invoices.aggregate([
      {
        $match: {
          $or: [
            { 'customer.name': { $regex: new RegExp(query, 'i') } },
            { 'customer.email': { $regex: new RegExp(query, 'i') } },
            { amount: { $regex: new RegExp(query, 'i') } },
            { date: { $regex: new RegExp(query, 'i') } },
            { status: { $regex: new RegExp(query, 'i') } },
          ],
        },
      },
      {
        $lookup: {
          from: 'customers', // Name of the "customers" collection
          localField: 'customer_id',
          foreignField: 'id',
          as: 'customer',
        },
      },
      {
        $unwind: '$customer'
      },
      {
        $project: {
          amount: 1,
          name: '$customer.name',
          image_url: '$customer.image_url',
          email: '$customer.email',
          date: 1,
          status: 1
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: ITEMS_PER_PAGE,
      },
    ])


    return invoices;
  } catch (error) {
    console.log('Database Error:', error);
    return { error: 'Failed to card data.' };
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const pipeline = [
      {
        $match: {
          $or: [
            { 'customers.name': { $regex: new RegExp(query, 'i') } },
            { 'customers.email': { $regex: new RegExp(query, 'i') } },
          ],
        },
      },
      {
        $count: 'invoices'
      }
    ]
    const count = await Invoices.aggregate(pipeline)
    const totalPages = Math.ceil(Number(count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

// export async function fetchInvoiceById(id: string) {
//   try {
//     const data = await sql<InvoiceForm>`
//       SELECT
//         invoices.id,
//         invoices.customer_id,
//         invoices.amount,
//         invoices.status
//       FROM invoices
//       WHERE invoices.id = ${id};
//     `;

//     const invoice = data.rows.map((invoice) => ({
//       ...invoice,
//       // Convert amount from cents to dollars
//       amount: invoice.amount / 100,
//     }));

//     return invoice[0];
//   } catch (error) {
//     console.error('Database Error:', error);
//   }
// }

export async function fetchCustomers() {
  try {
    await connectToDB();
    const customers = await Customers.find({})
    return customers;
  } catch (err) {
    console.log('Database Error:', err);
    return ('Failed to fetch all customers.');
  }
}

// export async function fetchFilteredCustomers(query: string) {
//   try {
//     const data = await sql<CustomersTable>`
// 		SELECT
// 		  customers.id,
// 		  customers.name,
// 		  customers.email,
// 		  customers.image_url,
// 		  COUNT(invoices.id) AS total_invoices,
// 		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
// 		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
// 		FROM customers
// 		LEFT JOIN invoices ON customers.id = invoices.customer_id
// 		WHERE
// 		  customers.name ILIKE ${`%${query}%`} OR
//         customers.email ILIKE ${`%${query}%`}
// 		GROUP BY customers.id, customers.name, customers.email, customers.image_url
// 		ORDER BY customers.name ASC
// 	  `;

//     const customers = data.rows.map((customer) => ({
//       ...customer,
//       total_pending: formatCurrency(customer.total_pending),
//       total_paid: formatCurrency(customer.total_paid),
//     }));

//     return customers;
//   } catch (err) {
//     console.error('Database Error:', err);
//     throw new Error('Failed to fetch customer table.');
//   }
// }

// export async function getUser(email: string) {
//   try {
//     const user = await sql`SELECT * from USERS where email=${email}`;
//     return user.rows[0] as User;
//   } catch (error) {
//     console.error('Failed to fetch user:', error);
//     throw new Error('Failed to fetch user.');
//   }
// }
