export interface ServiceTree {
  id: string
  name: string
  full_path: string
  node_type: 'category' | 'subcategory' | 'service' 
  service_id?: string
  parent_id?: string
  level: number
  description?: string
  children?: ServiceTree[]
}