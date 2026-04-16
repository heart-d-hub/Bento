import type { VehicleCatalogState, VehicleEngineDef } from '@/features/vehicle/data/types'

const hondaCivicEngines: VehicleEngineDef[] = [
  {
    id: 'eng-civ-15t',
    powertrain_type: 'ice',
    engine_size: '1.5 Turbo',
    engine_code: 'L15B7',
    engine_code_aliases: ['L15B'],
    fuel_type: 'bensin',
    motor_power: null,
    battery_capacity: null,
    variants: [{ id: 'e-h-civ-1', yearFrom: 2016, yearTo: 2025, generationCode: 'FC' }],
  },
  {
    id: 'eng-civ-18',
    powertrain_type: 'ice',
    engine_size: '1.8',
    engine_code: 'R18A',
    fuel_type: 'bensin',
    motor_power: null,
    battery_capacity: null,
    variants: [{ id: 'e-h-civ-2', yearFrom: 2016, yearTo: 2020 }],
  },
]

const hondaCityEngines: VehicleEngineDef[] = [
  {
    id: 'eng-city-10t',
    powertrain_type: 'ice',
    engine_size: '1.0 Turbo',
    engine_code: 'P10A',
    fuel_type: 'bensin',
    motor_power: null,
    battery_capacity: null,
    variants: [{ id: 'e-h-city-1', yearFrom: 2019, yearTo: 2025 }],
  },
]

const toyotaCamryEngines: VehicleEngineDef[] = [
  {
    id: 'eng-cam-25h',
    powertrain_type: 'hev',
    engine_size: '2.5',
    engine_code: 'A25A',
    fuel_type: 'bensin',
    motor_power: 88,
    battery_capacity: 1.6,
    variants: [{ id: 'e-t-cam-1', yearFrom: 2018, yearTo: 2025 }],
  },
]

export const INITIAL_VEHICLE_CATALOG: VehicleCatalogState = {
  categories: [
    { id: 'car', label: 'รถยนต์', sortOrder: 10 },
    { id: 'truck', label: 'รถบรรทุก', sortOrder: 20 },
    { id: 'engine', label: 'ENGINE', sortOrder: 30 },
    { id: 'motorcycle', label: 'รถมอเตอร์ไซค์', sortOrder: 40 },
  ],
  byCategory: {
    car: {
      brands: [
        { id: 'b-honda', name: 'HONDA' },
        { id: 'b-toyota', name: 'TOYOTA' },
      ],
      modelsByBrandId: {
        'b-honda': [
          { id: 'm-civic', name: 'CIVIC' },
          { id: 'm-city', name: 'CITY' },
        ],
        'b-toyota': [{ id: 'm-camry', name: 'CAMRY' }],
      },
      enginesByModelId: {
        'm-civic': hondaCivicEngines,
        'm-city': hondaCityEngines,
        'm-camry': toyotaCamryEngines,
      },
    },
    truck: {
      brands: [{ id: 'b-isuzu', name: 'ISUZU' }],
      modelsByBrandId: {
        'b-isuzu': [{ id: 'm-dmax', name: 'D-MAX' }],
      },
      enginesByModelId: {
        'm-dmax': [
          {
            id: 'eng-dmax-30',
            line_kind: 'truck',
            powertrain_type: 'ice',
            engine_size: null,
            engine_code: '4JJ1',
            engine_code_aliases: ['4JJ'],
            fuel_type: 'diesel',
            motor_power: null,
            battery_capacity: null,
            truck_euro: 'EURO 5',
            truck_wheel_config: '4 ล้อ',
            truck_hp: 190,
            variants: [{ id: 'e-dmax-1', yearFrom: 1900, yearTo: 2100 }],
          },
        ],
      },
    },
    engine: {
      brands: [{ id: 'b-misc', name: 'เครื่องทั่วไป' }],
      modelsByBrandId: {
        'b-misc': [{ id: 'm-genset', name: 'ปั๊ม/เครื่องปั่นไฟ' }],
      },
      enginesByModelId: {
        'm-genset': [
          {
            id: 'eng-gx390',
            powertrain_type: 'ice',
            engine_size: 'HONDA GX390',
            engine_code: 'GX390',
            fuel_type: 'unspecified',
            motor_power: null,
            battery_capacity: null,
            variants: [{ id: 'e-gen-1', yearFrom: 2000, yearTo: 2099 }],
          },
          {
            id: 'eng-yanmar-10',
            powertrain_type: 'ice',
            engine_size: 'YANMAR 10hp',
            engine_code: 'TF105',
            fuel_type: 'diesel',
            motor_power: null,
            battery_capacity: null,
            variants: [{ id: 'e-gen-2', yearFrom: 2000, yearTo: 2099 }],
          },
        ],
      },
    },
    motorcycle: {
      brands: [{ id: 'b-yamaha', name: 'YAMAHA' }],
      modelsByBrandId: {
        'b-yamaha': [{ id: 'm-fz', name: 'FZ' }],
      },
      enginesByModelId: {
        'm-fz': [
          {
            id: 'eng-fz-150',
            powertrain_type: 'ice',
            engine_size: '150 cc',
            engine_code: '154FMI',
            fuel_type: 'bensin',
            motor_power: null,
            battery_capacity: null,
            variants: [{ id: 'e-fz-1', yearFrom: 2018, yearTo: 2025 }],
          },
        ],
      },
    },
  },
}
