import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { clientName: { contains: query } },
          { invoiceNumber: { contains: query } },
        ],
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceNumber, invoiceDate, dueDate, clientName, clientEmail, clientAddress, grandTotal, items } = body;

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate,
        dueDate,
        clientName,
        clientEmail,
        clientAddress,
        grandTotal,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save invoice' }, { status: 500 });
  }
}