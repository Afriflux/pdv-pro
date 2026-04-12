import { redirect } from 'next/navigation'

export default function AdminVendorsRedirect() {
  // Cette page est dépréciée. L'annuaire des vendeurs est désormais géré
  // de manière centralisée par la page globale "Tous Utilisateurs" (/admin/users).
  redirect('/admin/users?role=vendeur')
}
