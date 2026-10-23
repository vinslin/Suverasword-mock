import { useState, useEffect } from 'react'
import { getNotifications } from './api'

export function useNotifications(company, registrations, companyId) {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!companyId) { setNotifications([]); return }
    getNotifications(companyId)
      .then(setNotifications)
      .catch(() => setNotifications([]))
  }, [companyId, company?.journeyStep, registrations.length])

  return notifications
}
