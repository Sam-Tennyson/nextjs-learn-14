'use server'
import { z } from 'zod';
import { connectToDB } from './database';
import Invoices from '@/models/invoices';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';

const InvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
});

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });
export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }
    const { customerId, amount, status } = CreateInvoice.parse({

        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    let payload = {
        customer_id: customerId,
        amount: amountInCents,
        status,
        date
    }

    try {
        await connectToDB();
        await new Invoices(payload).save();
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    }
    revalidatePath("/dashboard/invoices")
    redirect('/dashboard/invoices');
}

const UpdateInvoice = InvoiceSchema.omit({ date: true })
export async function updateInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        id: formData.get('id'),
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Invoice.',
        };
    }
    const { id, customerId, amount, status } = UpdateInvoice.parse({
        id: formData.get('id'),
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    let payload = {
        customer_id: customerId,
        amount: amountInCents,
        status,
        date
    }
    try {
        await connectToDB();
        await Invoices.findByIdAndUpdate(id, payload);
    } catch (error) {
        return {
            message: 'Database Error: Failed to Update Invoice.',
        };
    }
    revalidatePath("/dashboard/invoices")
    redirect('/dashboard/invoices');
}

const DeleteInvoice = InvoiceSchema.pick({ id: true });
export async function deleteInvoice(formData: FormData) {
    const { id } = DeleteInvoice.parse({
        id: formData.get('id')?.toString(),
    });
    try {
        await connectToDB();
        await Invoices.findByIdAndDelete(id);
    } catch (error) {
        return {
            message: 'Database Error: Failed to Delete Invoice.',
        };
    }
    revalidatePath("/dashboard/invoices")
    redirect('/dashboard/invoices');
}


export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', Object.fromEntries(formData));
    } catch (error) {
        if ((error as Error).message.includes('CredentialsSignin')) {
            return 'CredentialSignin';
        }
        throw error;
    }
}