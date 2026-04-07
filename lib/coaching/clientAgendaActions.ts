"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getClientBookings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  // Fetch all bookings where the order belongs to this buyer
  const bookings = await prisma.booking.findMany({
    where: { 
      order: {
        buyer_id: user.id
      }
    },
    orderBy: [{ booking_date: 'asc' }, { start_time: 'asc' }],
    include: {
      order: {
        select: {
          id: true,
          total: true,
          status: true,
          buyer: {
            select: { name: true, phone: true, email: true }
          }
        }
      },
      product: { select: { name: true, booking_link: true } }
    }
  });

  return bookings;
}
