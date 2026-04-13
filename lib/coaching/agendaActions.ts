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

  const slots = await prisma.coachingSlot.findMany({ take: 50, 
    where: { store_id: store.id },
    orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }]
  });

  return slots;
}

export async function getAgendaSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { coaching_max_per_day: true, coaching_min_notice: true, coaching_auto_accept: true, coaching_buffer_time: true, coaching_max_future_days: true }
  });

  return store;
}

export async function updateAgendaSettings(data: { coaching_max_per_day: number, coaching_min_notice: number, coaching_auto_accept: boolean, coaching_buffer_time: number, coaching_max_future_days: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  try {
    await prisma.store.update({
      where: { user_id: user.id },
      data
    });
    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { success: false, error: "Erreur lors de la mise à jour des paramètres." };
  }
}

export async function getBlockedDates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true }
  });

  if (!store) throw new Error("Boutique introuvable");

  const blocked = await prisma.blockedDate.findMany({ take: 50, 
    where: { store_id: store.id },
    orderBy: { date: 'asc' }
  });

  return blocked;
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

export async function addBlockedDate(date: string, startTime?: string, endTime?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true }
  });

  if (!store) throw new Error("Boutique introuvable");

  try {
    const parsedDate = new Date(date);
    
    // Create explicitly without relying on store_id_date uniqueness constraint
    await prisma.blockedDate.create({
      data: {
        store_id: store.id,
        date: parsedDate,
        start_time: startTime || null,
        end_time: endTime || null,
      }
    });

    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error) {
    console.error("Error adding blocked date:", error);
    return { success: false, error: "Erreur lors de l'ajout" };
  }
}

export async function addBlockedDatesRange(dates: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true }
  });

  if (!store) throw new Error("Boutique introuvable");

  try {
    await prisma.blockedDate.createMany({
      data: dates.map(d => ({
        store_id: store.id,
        date: new Date(d),
      }))
    });

    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error) {
    console.error("Error adding blocked dates range:", error);
    return { success: false, error: "Erreur lors de l'ajout de la période" };
  }
}

export async function removeBlockedDate(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true }
  });
  if (!store) throw new Error("Boutique introuvable");

  try {
    await prisma.blockedDate.delete({
      where: { id }
    });
    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error) {
    console.error("Error removing blocked date:", error);
    return { success: false, error: "Erreur lors de la suppression" };
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

  const bookings = await prisma.booking.findMany({ take: 50, 
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

export async function updateBookingStatus(bookingId: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true }
  });

  if (!store) throw new Error("Boutique introuvable");

  try {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, store_id: store.id }
    });

    if (!booking) throw new Error("Réservation introuvable");

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status }
    });

    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error) {
    console.error("Error updating booking status:", error);
    return { success: false, error: "Erreur lors de la mise à jour du statut" };
  }
}
