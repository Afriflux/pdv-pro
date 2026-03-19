"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAgendaSlots() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true }
  });

  if (!store) throw new Error("Boutique introuvable");

  const slots = await prisma.coachingSlot.findMany({
    where: { store_id: store.id },
    orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }]
  });

  return slots;
}

export async function saveAgendaSlots(slots: { day_of_week: number; start_time: string; end_time: string; active: boolean }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true }
  });

  if (!store) throw new Error("Boutique introuvable");

  try {
    // Synchronisation simple : on supprime l'ancien planning et on insère le nouveau
    await prisma.$transaction([
      prisma.coachingSlot.deleteMany({ where: { store_id: store.id } }),
      prisma.coachingSlot.createMany({
        data: slots.map(s => ({
          store_id: store.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          active: s.active
        }))
      })
    ]);

    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error) {
    console.error("Error saving slots:", error);
    return { success: false, error: "Erreur lors de l'enregistrement des horaires" };
  }
}

export async function getUpcomingBookings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true }
  });

  if (!store) throw new Error("Boutique introuvable");

  const bookings = await prisma.booking.findMany({
    where: { store_id: store.id },
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
