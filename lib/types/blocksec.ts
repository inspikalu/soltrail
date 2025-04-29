// Types for BlockSec AML API

export interface Category {
  name: string
  code: number
}

export interface EntityDescription {
  website: string
  twitter: string
  telegram: string
  discord: string
}

export interface EntityInfo {
  entity: string
  categories: Category[]
  attributes: any | null
  description: EntityDescription
}

export interface Attribute {
  name: string
  code: number
  comp_info: string[]
}

export interface AddressLabelData {
  chain_id: number
  address: string
  main_entity: string
  main_entity_info: EntityInfo
  comp_entities: string[]
  attributes: Attribute[]
  name_tag: string
}

export interface AddressLabelResponse {
  request_id: string
  code: number
  message: string
  data: AddressLabelData
}

export interface AddressLabelRequest {
  chain_id: number
  address: string
}
