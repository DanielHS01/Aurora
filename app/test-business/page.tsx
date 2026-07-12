import { getActiveBusinessForUser } from '@/lib/auth/session'
import { getBusinessUsers } from '@/lib/queries/business-users'
import { BusinessForm } from './business-form'

export default async function TestBusinessPage() {
  const userBusinesses = await getActiveBusinessForUser()

  return (
    <div className="p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold mb-4">Crear negocio</h1>
        <BusinessForm />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Tus negocios</h2>
        {userBusinesses.length === 0 && <p>No tienes negocios aún.</p>}

        {userBusinesses.map(({ business, role }) => (
          <BusinessMembersBlock key={business.id} businessId={business.id} businessName={business.name} role={role} />
        ))}
      </div>
    </div>
  )
}

async function BusinessMembersBlock({
  businessId,
  businessName,
  role,
}: {
  businessId: string
  businessName: string
  role: string
}) {
  const members = await getBusinessUsers(businessId)

  return (
    <div className="border rounded p-4 mb-3">
      <p className="font-medium">
        {businessName} <span className="text-sm text-gray-500">(tu rol: {role})</span>
      </p>
      <ul className="mt-2 text-sm">
        {members.map((m) => (
          <li key={m.id}>
            {m.profile.full_name ?? m.profile.email ?? m.user_id} — {m.role}
          </li>
        ))}
      </ul>
    </div>
  )
}