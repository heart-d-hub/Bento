/**
 * Brembo Brake Pads — Japan / Asian Vehicles
 * นำเข้าจากไฟล์ Excel (Brembo_Pads_Japan_Asian_POS_2569.xlsx)
 * ฉบับวันที่ 25 มีนาคม 2569 / Source PDF: 4_BC_01_BRBP_Japan_69_03_25.pdf
 *
 * 1 SKU = 1 product, vehicleFitments[] รวมรถทุกรุ่นที่ใช้ผ้าเบรกเบอร์เดียวกัน
 */
import type { ProductMasterDetail } from '@/features/inventory/data/productMasterData'

export const BREMBO_IMPORT_PRODUCTS: ReadonlyArray<Omit<ProductMasterDetail, 'inStoreCatalog'>> = [
  {
    "id": "pm-brembo-1",
    "sku": "P24 048N",
    "name": "Brembo Pad NAO P24 048N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "96534653",
      "GDB3330",
      "DB1748"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 710,
    "supplierListPrice": 710,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-1",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-1-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-aveo-1-4",
        "modelName": "AVEO 1.4",
        "engineId": "e-chevrolet-aveo-1-4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2014,
        "yearRangeText": "2006 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-1-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-aveo-1-6",
        "modelName": "AVEO 1.6",
        "engineId": "e-chevrolet-aveo-1-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2012,
        "yearRangeText": "2009 - 2012",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-1-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-proton",
        "brandName": "Proton",
        "modelId": "m-proton-savvy-saga",
        "modelName": "Savvy / Saga",
        "engineId": "e-proton-savvy-saga",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearRangeText": "2010 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-2",
    "sku": "P10 001B",
    "name": "Brembo Pad Low-M P10 001B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "96405131",
      "GDB3348",
      "DB1690"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 950,
    "supplierListPrice": 950,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-2",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-2-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-aveo-1-6",
        "modelName": "AVEO 1.6",
        "engineId": "e-chevrolet-aveo-1-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2012,
        "yearRangeText": "2009 - 2012",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-2-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-optra-1j-1-6l-1-8l",
        "modelName": "OPTRA (1J) 1.6L 1.8L",
        "engineId": "e-chevrolet-optra-1j-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2007,
        "yearRangeText": "2003 - 2007",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-3",
    "sku": "P10 001N",
    "name": "Brembo Pad NAO P10 001N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "96405131",
      "GDB3348",
      "DB1690"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 900,
    "supplierListPrice": 900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-3",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-3-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-aveo-1-6",
        "modelName": "AVEO 1.6",
        "engineId": "e-chevrolet-aveo-1-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2012,
        "yearRangeText": "2009 - 2012",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-3-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-optra-1j-1-6l-1-8l",
        "modelName": "OPTRA (1J) 1.6L 1.8L",
        "engineId": "e-chevrolet-optra-1j-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2007,
        "yearRangeText": "2003 - 2007",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-4",
    "sku": "P11 024N",
    "name": "Brembo Pad NAO P11 024N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "68034993AA",
      "GDB4171"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2200,
    "supplierListPrice": 2200,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-4",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-4-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-camaro-3-6-6-2",
        "modelName": "CAMARO 3.6/6.2",
        "engineId": "e-chevrolet-camaro-3-6-6-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2015,
        "yearRangeText": "2009 - 2015",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-5",
    "sku": "P37 018N",
    "name": "Brembo Pad NAO P37 018N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "25940447",
      "GDB4450"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 4500,
    "supplierListPrice": 4500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-5",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-5-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-camaro-2-0-6-2",
        "modelName": "CAMARO 2.0/6.2",
        "engineId": "e-chevrolet-camaro-2-0-6-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearRangeText": "2016 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-5-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-gt-r-r35-3-8-v6",
        "modelName": "GT-R (R35) 3.8 V6",
        "engineId": "e-nissan-gt-r-r35-3-8-v6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearRangeText": "2007 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-6",
    "sku": "P10 003N",
    "name": "Brembo Pad NAO P10 003N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "96626070",
      "GDB1715",
      "DB1850"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1350,
    "supplierListPrice": 1350,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-6",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-6-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-captiva-2-0-2-4-2wd-4wd",
        "modelName": "CAPTIVA 2.0 2.4 2WD/4WD",
        "engineId": "e-chevrolet-captiva-2-0-2-4-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2019,
        "yearRangeText": "2007 - 2019",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-7",
    "sku": "P10 004N",
    "name": "Brembo Pad NAO P10 004N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "96626076",
      "GDB1716",
      "DB1862"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1060,
    "supplierListPrice": 1060,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-7",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-7-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-captiva-2-0-2-4-2wd-4wd",
        "modelName": "CAPTIVA 2.0 2.4 2WD/4WD",
        "engineId": "e-chevrolet-captiva-2-0-2-4-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2019,
        "yearRangeText": "2007 - 2019",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-8",
    "sku": "P34 005B",
    "name": "Brembo Pad Low-M P34 005B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "8973682520",
      "GDB3466",
      "DB1468"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 800,
    "supplierListPrice": 800,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-8",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-8-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-colorado-2-5d-3-0d-2wd-4wd",
        "modelName": "COLORADO 2.5D 3.0D 2WD/4WD",
        "engineId": "e-chevrolet-colorado-2-5d-3-0d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2011,
        "yearRangeText": "2004 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-8-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-d-max-2-5d-3-0d-2wd",
        "modelName": "D-MAX 2.5D 3.0D 2WD",
        "engineId": "e-isuzu-d-max-2-5d-3-0d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2006,
        "yearRangeText": "2002 - 2006",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-8-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-d-max-2-5d-3-0d-2wd-hi-lander-4wd",
        "modelName": "D-MAX 2.5D 3.0D 2WD Hi-Lander/4WD",
        "engineId": "e-isuzu-d-max-2-5d-3-0d-2wd-hi-lander-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2006,
        "yearRangeText": "2002 - 2006",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-8-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-mu-7-3-0d-2wd-4wd",
        "modelName": "MU-7 3.0D 2WD/4WD",
        "engineId": "e-isuzu-mu-7-3-0d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2006,
        "yearRangeText": "2004 - 2006",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-9",
    "sku": "P34 005N",
    "name": "Brembo Pad NAO P34 005N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "8973682520",
      "GDB3466",
      "DB1468"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 850,
    "supplierListPrice": 850,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-9",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-9-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-colorado-2-5d-3-0d-2wd-4wd",
        "modelName": "COLORADO 2.5D 3.0D 2WD/4WD",
        "engineId": "e-chevrolet-colorado-2-5d-3-0d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2011,
        "yearRangeText": "2004 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-9-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-d-max-2-5d-3-0d-2wd",
        "modelName": "D-MAX 2.5D 3.0D 2WD",
        "engineId": "e-isuzu-d-max-2-5d-3-0d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2006,
        "yearRangeText": "2002 - 2006",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-9-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-d-max-2-5d-3-0d-2wd-hi-lander-4wd",
        "modelName": "D-MAX 2.5D 3.0D 2WD Hi-Lander/4WD",
        "engineId": "e-isuzu-d-max-2-5d-3-0d-2wd-hi-lander-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2006,
        "yearRangeText": "2002 - 2006",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-9-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-mu-7-3-0d-2wd-4wd",
        "modelName": "MU-7 3.0D 2WD/4WD",
        "engineId": "e-isuzu-mu-7-3-0d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2006,
        "yearRangeText": "2004 - 2006",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-10",
    "sku": "P34 007N",
    "name": "Brembo Pad NAO P34 007N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "8980791040",
      "GDB7774",
      "DB1841"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 990,
    "supplierListPrice": 990,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-10",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-10-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-colorado-2-5d-2-8d-2wd-4wd",
        "modelName": "COLORADO 2.5D 2.8D 2WD/4WD",
        "engineId": "e-chevrolet-colorado-2-5d-2-8d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2016,
        "yearRangeText": "2011 - 2016",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-10-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-trailblazer-31ux-2-5l-2-8l-2wd-4wd",
        "modelName": "TRAILBLAZER (31UX) 2.5L 2.8L 2WD/4WD",
        "engineId": "e-chevrolet-trailblazer-31ux-2-5l-2-8l-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2016,
        "yearRangeText": "2012 - 2016",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-10-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-d-max-gold-platinum-2-5d-3-0d-2wd",
        "modelName": "D-MAX (GOLD/PLATINUM) 2.5D 3.0D 2WD",
        "engineId": "e-isuzu-d-max-gold-platinum-2-5d-3-0d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2011,
        "yearRangeText": "2007 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-10-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-d-max-gold-platinum-2-5d-3-0d-2wd-hi-lander-4wd",
        "modelName": "D-MAX (GOLD/PLATINUM) 2.5D 3.0D 2WD Hi-Lander/4WD",
        "engineId": "e-isuzu-d-max-gold-platinum-2-5d-3-0d-2wd-hi-lander-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2011,
        "yearRangeText": "2007 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-10-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-d-max-all-new-2-5d-3-0d-2wd",
        "modelName": "D-MAX (ALL NEW) 2.5D 3.0D 2WD",
        "engineId": "e-isuzu-d-max-all-new-2-5d-3-0d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2015,
        "yearRangeText": "2011 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-10-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-d-max-all-new-2-5d-3-0d-2wd-hi-lander-4wd",
        "modelName": "D-MAX (ALL NEW) 2.5D 3.0D 2WD Hi-Lander/4WD",
        "engineId": "e-isuzu-d-max-all-new-2-5d-3-0d-2wd-hi-lander-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2015,
        "yearRangeText": "2011 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-10-6",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-d-max-all-new-blue-power-1-9d-2wd",
        "modelName": "D-MAX (ALL NEW) BLUE POWER 1.9D 2WD",
        "engineId": "e-isuzu-d-max-all-new-blue-power-1-9d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2019,
        "yearRangeText": "2015 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-10-7",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-d-max-all-new-blue-power-3-0d-2wd-hi-lander-4wd",
        "modelName": "D-MAX (ALL NEW) BLUE POWER 3.0D 2WD Hi-Lander/4WD",
        "engineId": "e-isuzu-d-max-all-new-blue-power-3-0d-2wd-hi-lander-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2019,
        "yearRangeText": "2015 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-10-8",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-mu-7-3-0d-2wd-4wd",
        "modelName": "MU-7 3.0D 2WD/4WD",
        "engineId": "e-isuzu-mu-7-3-0d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2013,
        "yearRangeText": "2007 - 2013",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-10-9",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-mu-x-rf10-2-5d-3-0d-2wd-4wd",
        "modelName": "MU-X (RF10) 2.5D 3.0D 2WD/4WD",
        "engineId": "e-isuzu-mu-x-rf10-2-5d-3-0d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2016,
        "yearRangeText": "2013 - 2016",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-10-10",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-mu-x-rf20-blue-power-1-9d-3-0d-2wd-4wd",
        "modelName": "MU-X (RF20) BLUE POWER 1.9D 3.0D 2WD/4WD",
        "engineId": "e-isuzu-mu-x-rf20-blue-power-1-9d-3-0d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearTo": 2020,
        "yearRangeText": "2016 - 2020",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-10-11",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-extender-2-0d-turbo",
        "modelName": "Extender 2.0D Turbo",
        "engineId": "e-mg-extender-2-0d-turbo",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-10-12",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-extender-2-0d-turbo-grand",
        "modelName": "Extender 2.0D Turbo Grand",
        "engineId": "e-mg-extender-2-0d-turbo-grand",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-11",
    "sku": "P56 106N",
    "name": "Brembo Pad NAO P56 106N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D10604GA0A",
      "GDB7985",
      "DB2341"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1230,
    "supplierListPrice": 1230,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-11",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-11-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-colorado-31ux-2-5d-2-8d",
        "modelName": "COLORADO (31UX) 2.5D 2.8D",
        "engineId": "e-chevrolet-colorado-31ux-2-5d-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearRangeText": "2016 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-11-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-x-trail-t32-2-0l-2-5l",
        "modelName": "X-TRAIL T32 2.0L 2.5L",
        "engineId": "e-nissan-x-trail-t32-2-0l-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2019,
        "yearRangeText": "2014 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-11-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-x-trail-t32-2-0l-2-5l-epb",
        "modelName": "X-TRAIL T32 2.0L 2.5L (EPB)",
        "engineId": "e-nissan-x-trail-t32-2-0l-2-5l-epb",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-12",
    "sku": "P59 076N",
    "name": "Brembo Pad NAO P59 076N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "13412272",
      "GDB1843"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1310,
    "supplierListPrice": 1310,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-12",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-12-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-cruze-j300-1-6l-1-8l",
        "modelName": "CRUZE (J300) 1.6L 1.8L",
        "engineId": "e-chevrolet-cruze-j300-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2015,
        "yearRangeText": "2010 - 2015",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-13",
    "sku": "P59 080N",
    "name": "Brembo Pad NAO P59 080N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "13319293",
      "GDB1844",
      "DB1990"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1160,
    "supplierListPrice": 1160,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-13",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-13-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-cruze-j300-1-6l-1-8l",
        "modelName": "CRUZE (J300) 1.6L 1.8L",
        "engineId": "e-chevrolet-cruze-j300-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2015,
        "yearRangeText": "2010 - 2015",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-13-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-cruze-j300-2-0d",
        "modelName": "CRUZE (J300) 2.0D",
        "engineId": "e-chevrolet-cruze-j300-2-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2015,
        "yearRangeText": "2010 - 2015",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-14",
    "sku": "P59 077B",
    "name": "Brembo Pad Low-M P59 077B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "13301234",
      "GDB1847",
      "DB1989"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1450,
    "supplierListPrice": 1450,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-14",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-14-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-cruze-j300-2-0d",
        "modelName": "CRUZE (J300) 2.0D",
        "engineId": "e-chevrolet-cruze-j300-2-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2015,
        "yearRangeText": "2010 - 2015",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-15",
    "sku": "P59 077N",
    "name": "Brembo Pad NAO P59 077N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "13301234",
      "GDB1847",
      "DB1989"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1520,
    "supplierListPrice": 1520,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-15",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-15-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-cruze-j300-2-0d",
        "modelName": "CRUZE (J300) 2.0D",
        "engineId": "e-chevrolet-cruze-j300-2-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2015,
        "yearRangeText": "2010 - 2015",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-16",
    "sku": "P15 002B",
    "name": "Brembo Pad Low-M P15 002B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "96405129",
      "GDB3171",
      "DB1698"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1550,
    "supplierListPrice": 1550,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-16",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-16-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-optra-1j-1-6l-1-8l",
        "modelName": "OPTRA (1J) 1.6L 1.8L",
        "engineId": "e-chevrolet-optra-1j-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2007,
        "yearRangeText": "2003 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-16-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-optra-1j-1-6l-1-8l",
        "modelName": "OPTRA (1J) 1.6L 1.8L",
        "engineId": "e-chevrolet-optra-1j-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2011,
        "yearRangeText": "2008 - 2011",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-17",
    "sku": "P15 002N",
    "name": "Brembo Pad NAO P15 002N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "96405129",
      "GDB3171",
      "DB1698"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1670,
    "supplierListPrice": 1670,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-17",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-17-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-optra-1j-1-6l-1-8l",
        "modelName": "OPTRA (1J) 1.6L 1.8L",
        "engineId": "e-chevrolet-optra-1j-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2007,
        "yearRangeText": "2003 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-17-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-optra-1j-1-6l-1-8l",
        "modelName": "OPTRA (1J) 1.6L 1.8L",
        "engineId": "e-chevrolet-optra-1j-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2011,
        "yearRangeText": "2008 - 2011",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-18",
    "sku": "P10 053N",
    "name": "Brembo Pad NAO P10 053N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "96800089",
      "GDB4178"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1040,
    "supplierListPrice": 1040,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-18",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-18-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-optra-1j-1-6l-1-8l",
        "modelName": "OPTRA (1J) 1.6L 1.8L",
        "engineId": "e-chevrolet-optra-1j-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2011,
        "yearRangeText": "2008 - 2011",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-19",
    "sku": "P28 082N",
    "name": "Brembo Pad NAO P28 082N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "8982325430",
      "GDB7883",
      "DB2290"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1240,
    "supplierListPrice": 1240,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-19",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-19-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-trailblazer-31ux-2-5l-2-8l-2wd-4wd",
        "modelName": "TRAILBLAZER (31UX) 2.5L 2.8L 2WD/4WD",
        "engineId": "e-chevrolet-trailblazer-31ux-2-5l-2-8l-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2016,
        "yearRangeText": "2012 - 2016",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-19-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-mu-x-rf20-blue-power-1-9d-3-0d-2wd-4wd",
        "modelName": "MU-X (RF20) BLUE POWER 1.9D 3.0D 2WD/4WD",
        "engineId": "e-isuzu-mu-x-rf20-blue-power-1-9d-3-0d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearTo": 2020,
        "yearRangeText": "2016 - 2020",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-20",
    "sku": "P59 045N",
    "name": "Brembo Pad NAO P59 045N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "9192157",
      "GDB1350",
      "DB1437"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2280,
    "supplierListPrice": 2280,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-20",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-20-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-zafira-f75-1-8l-2-2l",
        "modelName": "ZAFIRA (F75) 1.8L 2.2L",
        "engineId": "e-chevrolet-zafira-f75-1-8l-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2002,
        "yearRangeText": "2000 - 2002",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-20-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-zafira-f75-1-8l-2-2l",
        "modelName": "ZAFIRA (F75) 1.8L 2.2L",
        "engineId": "e-chevrolet-zafira-f75-1-8l-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2004,
        "yearRangeText": "2002 - 2004",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-21",
    "sku": "P59 031B",
    "name": "Brembo Pad Low-M P59 031B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "93170602",
      "GDB1471",
      "DB1425"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1350,
    "supplierListPrice": 1350,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-21",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-21-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-zafira-f75-1-8l-2-2l",
        "modelName": "ZAFIRA (F75) 1.8L 2.2L",
        "engineId": "e-chevrolet-zafira-f75-1-8l-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2002,
        "yearRangeText": "2000 - 2002",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-22",
    "sku": "P59 031N",
    "name": "Brembo Pad NAO P59 031N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "93170602",
      "GDB1471",
      "DB1425"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1280,
    "supplierListPrice": 1280,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-22",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-22-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-zafira-f75-1-8l-2-2l",
        "modelName": "ZAFIRA (F75) 1.8L 2.2L",
        "engineId": "e-chevrolet-zafira-f75-1-8l-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2002,
        "yearRangeText": "2000 - 2002",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-23",
    "sku": "P59 038N",
    "name": "Brembo Pad NAO P59 038N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "93169143",
      "GDB1515",
      "DB1511"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1740,
    "supplierListPrice": 1740,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-23",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-23-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-chevrolet",
        "brandName": "Chevrolet",
        "modelId": "m-chevrolet-zafira-f75-1-8l-2-2l",
        "modelName": "ZAFIRA (F75) 1.8L 2.2L",
        "engineId": "e-chevrolet-zafira-f75-1-8l-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2004,
        "yearRangeText": "2002 - 2004",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-24",
    "sku": "P59 015N",
    "name": "Brembo Pad NAO P59 015N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "8944611550",
      "GDB870",
      "DB1116"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 900,
    "supplierListPrice": 900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-24",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-24-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-tfr-2-5d-2-8d-2wd",
        "modelName": "TFR มังกรทอง 2.5D 2.8D 2WD",
        "engineId": "e-isuzu-tfr-2-5d-2-8d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1992,
        "yearTo": 2002,
        "yearRangeText": "1992 - 2002",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-24-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-tfr-rodeo-turbo-2-5d-2-8d-4wd",
        "modelName": "TFR RODEO มังกรทอง TURBO 2.5D 2.8D 4WD",
        "engineId": "e-isuzu-tfr-rodeo-turbo-2-5d-2-8d-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1992,
        "yearTo": 2002,
        "yearRangeText": "1992 - 2002",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-25",
    "sku": "P59 020N",
    "name": "Brembo Pad NAO P59 020N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "8970475260",
      "GDB1186",
      "DB1270"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-25",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-25-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-trooper-4x4-3-2-3-8",
        "modelName": "TROOPER 4x4 3.2 3.8",
        "engineId": "e-isuzu-trooper-4x4-3-2-3-8",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1998,
        "yearRangeText": "1993 - 1998",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-26",
    "sku": "P59 021N",
    "name": "Brembo Pad NAO P59 021N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "8970352660",
      "GDB1187",
      "DB1280"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1400,
    "supplierListPrice": 1400,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-26",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-26-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-trooper-4x4-3-2-3-8",
        "modelName": "TROOPER 4x4 3.2 3.8",
        "engineId": "e-isuzu-trooper-4x4-3-2-3-8",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1998,
        "yearRangeText": "1993 - 1998",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-27",
    "sku": "P34 013N",
    "name": "Brembo Pad NAO P34 013N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "8975128370 / 8975214890",
      "GDB8341"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1350,
    "supplierListPrice": 1350,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-27",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-27-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-d-max-4x2-1-9-20",
        "modelName": "D-MAX 4x2 1.9 (ปี20)",
        "engineId": "e-isuzu-d-max-4x2-1-9-20",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-28",
    "sku": "P34 014N",
    "name": "Brembo Pad NAO P34 014N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "8975056800",
      "GDB8342"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1500,
    "supplierListPrice": 1500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-28",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-28-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-isuzu",
        "brandName": "Isuzu",
        "modelId": "m-isuzu-d-max-4x4-1-9-3-0-20",
        "modelName": "D-MAX 4x4 1.9/3.0 (ปี20)",
        "engineId": "e-isuzu-d-max-4x4-1-9-3-0-20",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-29",
    "sku": "P24 061N",
    "name": "Brembo Pad NAO P24 061N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "BPYK3323ZA",
      "GDB1583",
      "DB1679"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1260,
    "supplierListPrice": 1260,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-29",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-29-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ecosport-bk-1-5l",
        "modelName": "ECOSPORT (BK) 1.5L",
        "engineId": "e-ford-ecosport-bk-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearRangeText": "2016 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-29-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-focus-c307-1-6l-1-8l",
        "modelName": "FOCUS (C307) 1.6L 1.8L",
        "engineId": "e-ford-focus-c307-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2012,
        "yearRangeText": "2005 - 2012",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-29-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-focus-c346-1-6l-1-8l-2-0l",
        "modelName": "FOCUS (C346) 1.6L 1.8L 2.0L",
        "engineId": "e-ford-focus-c346-1-6l-1-8l-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-29-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-3-bk-1-6l-2-0l",
        "modelName": "MAZDA 3 (BK) 1.6L 2.0L",
        "engineId": "e-mazda-mazda-3-bk-1-6l-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2011,
        "yearRangeText": "2004 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-29-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-3-bl-1-6l-2-0l",
        "modelName": "MAZDA 3 (BL) 1.6L 2.0L",
        "engineId": "e-mazda-mazda-3-bl-1-6l-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2014,
        "yearRangeText": "2011 - 2014",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-30",
    "sku": "P24 056N",
    "name": "Brembo Pad NAO P24 056N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "EC253323ZA",
      "GDB1497",
      "DB1426"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1520,
    "supplierListPrice": 1520,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-30",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-30-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-escape-za-zb-2-0l-2-3l-3-0l",
        "modelName": "ESCAPE (ZA, ZB) 2.0L 2.3L 3.0L",
        "engineId": "e-ford-escape-za-zb-2-0l-2-3l-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2006,
        "yearRangeText": "2002 - 2006",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-30-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-tribute-2-0l-2-3l-3-0l",
        "modelName": "TRIBUTE 2.0L 2.3L 3.0L",
        "engineId": "e-mazda-tribute-2-0l-2-3l-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2007,
        "yearRangeText": "2000 - 2007",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-31",
    "sku": "P24 159N",
    "name": "Brembo Pad NAO P24 159N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "EFY53323Z",
      "GDB1752"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1610,
    "supplierListPrice": 1610,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-31",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-31-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-escape-zc-zd-2-3l",
        "modelName": "ESCAPE (ZC, ZD) 2.3L",
        "engineId": "e-ford-escape-zc-zd-2-3l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2014,
        "yearRangeText": "2007 - 2014",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-32",
    "sku": "P24 085N",
    "name": "Brembo Pad NAO P24 085N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "EFY52623Z",
      "GDB1754"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1420,
    "supplierListPrice": 1420,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-32",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-32-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-escape-zc-zd-2-3l",
        "modelName": "ESCAPE (ZC, ZD) 2.3L",
        "engineId": "e-ford-escape-zc-zd-2-3l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2014,
        "yearRangeText": "2007 - 2014",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-33",
    "sku": "P24 086B",
    "name": "Brembo Pad Low-M P24 086B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "UMY43328Z",
      "GDB3403",
      "DB1681"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1050,
    "supplierListPrice": 1050,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-33",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-33-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-everest-u268-2-5d-2wd-4wd",
        "modelName": "EVEREST (U268) 2.5D 2WD/4WD",
        "engineId": "e-ford-everest-u268-2-5d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2015,
        "yearRangeText": "2003 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-33-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-2-5d-2-9d-2wd",
        "modelName": "RANGER 2.5D 2.9D 2WD",
        "engineId": "e-ford-ranger-2-5d-2-9d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2011,
        "yearRangeText": "2006 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-33-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-2-5d-2-9d-2wd-hi-rider-4wd",
        "modelName": "RANGER 2.5D 2.9D 2WD Hi-Rider/4WD",
        "engineId": "e-ford-ranger-2-5d-2-9d-2wd-hi-rider-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2011,
        "yearRangeText": "2006 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-33-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-bt-50-2-5l-2wd",
        "modelName": "BT-50 2.5L 2WD",
        "engineId": "e-mazda-bt-50-2-5l-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2011,
        "yearRangeText": "2006 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-33-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-bt-50-3-2d-2wd-hi-racer-4wd",
        "modelName": "BT-50 3.2D 2WD Hi-Racer/4WD",
        "engineId": "e-mazda-bt-50-3-2d-2wd-hi-racer-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2011,
        "yearRangeText": "2006 - 2011",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-34",
    "sku": "P24 086N",
    "name": "Brembo Pad NAO P24 086N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "UMY43328Z",
      "GDB3403",
      "DB1681"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1160,
    "supplierListPrice": 1160,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-34",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-34-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-everest-u268-2-5d-2wd-4wd",
        "modelName": "EVEREST (U268) 2.5D 2WD/4WD",
        "engineId": "e-ford-everest-u268-2-5d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2015,
        "yearRangeText": "2003 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-34-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-2-5d-2-9d-2wd",
        "modelName": "RANGER 2.5D 2.9D 2WD",
        "engineId": "e-ford-ranger-2-5d-2-9d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2011,
        "yearRangeText": "2006 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-34-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-2-5d-2-9d-2wd-hi-rider-4wd",
        "modelName": "RANGER 2.5D 2.9D 2WD Hi-Rider/4WD",
        "engineId": "e-ford-ranger-2-5d-2-9d-2wd-hi-rider-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2011,
        "yearRangeText": "2006 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-34-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-bt-50-2-5l-2wd",
        "modelName": "BT-50 2.5L 2WD",
        "engineId": "e-mazda-bt-50-2-5l-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2011,
        "yearRangeText": "2006 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-34-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-bt-50-3-2d-2wd-hi-racer-4wd",
        "modelName": "BT-50 3.2D 2WD Hi-Racer/4WD",
        "engineId": "e-mazda-bt-50-3-2d-2wd-hi-racer-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2011,
        "yearRangeText": "2006 - 2011",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-35",
    "sku": "P24 207B",
    "name": "Brembo Pad Low-M P24 207B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "EB3C2001AA",
      "GDB8997",
      "DB2379"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1650,
    "supplierListPrice": 1650,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-35",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-35-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-everest-u375-2-2d-3-2d-2wd-4wd",
        "modelName": "EVEREST (U375) 2.2D 3.2D 2WD/4WD",
        "engineId": "e-ford-everest-u375-2-2d-3-2d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2022,
        "yearRangeText": "2015 - 2022",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-35-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-everest-u704-next-gen-2-0d-2wd-4wd",
        "modelName": "EVEREST (U704) Next Gen 2.0D 2WD/4WD",
        "engineId": "e-ford-everest-u704-next-gen-2-0d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2022,
        "yearRangeText": "2022 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-35-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-t6-raptor-2-0-4wd",
        "modelName": "RANGER T6 RAPTOR 2.0 4WD",
        "engineId": "e-ford-ranger-t6-raptor-2-0-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearTo": 2022,
        "yearRangeText": "2018 - 2022",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-36",
    "sku": "P24 225N",
    "name": "Brembo Pad NAO P24 225N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "EB3C2001AA / JB3C2001AC",
      "GDB8997",
      "DB2379",
      "EB3C2001AA"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-36",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-36-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-everest-u375-2-2d-3-2d-2wd-4wd",
        "modelName": "EVEREST (U375) 2.2D 3.2D 2WD/4WD",
        "engineId": "e-ford-everest-u375-2-2d-3-2d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2022,
        "yearRangeText": "2015 - 2022",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-36-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-everest-u704-next-gen-2-0d-2wd-4wd",
        "modelName": "EVEREST (U704) Next Gen 2.0D 2WD/4WD",
        "engineId": "e-ford-everest-u704-next-gen-2-0d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2022,
        "yearRangeText": "2022 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-36-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-t6-raptor-2-0-4wd",
        "modelName": "RANGER T6 RAPTOR 2.0 4WD",
        "engineId": "e-ford-ranger-t6-raptor-2-0-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearTo": 2022,
        "yearRangeText": "2018 - 2022",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-37",
    "sku": "P24 208B",
    "name": "Brembo Pad Low-M P24 208B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "EB3C2M007AA",
      "GDB8996",
      "DB2411"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1250,
    "supplierListPrice": 1250,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-37",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-37-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-everest-u375-2-2d-3-2d-2wd-4wd",
        "modelName": "EVEREST (U375) 2.2D 3.2D 2WD/4WD",
        "engineId": "e-ford-everest-u375-2-2d-3-2d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2022,
        "yearRangeText": "2015 - 2022",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-38",
    "sku": "P24 208N",
    "name": "Brembo Pad NAO P24 208N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "EB3C2M007AA",
      "GDB8996",
      "DB2411"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1370,
    "supplierListPrice": 1370,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-38",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-38-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-everest-u375-2-2d-3-2d-2wd-4wd",
        "modelName": "EVEREST (U375) 2.2D 3.2D 2WD/4WD",
        "engineId": "e-ford-everest-u375-2-2d-3-2d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2022,
        "yearRangeText": "2015 - 2022",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-39",
    "sku": "P16 013N",
    "name": "Brembo Pad NAO P16 013N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "DFY13328ZA",
      "GDB7836",
      "DB1941",
      "DGY13328Z / 55810-68L00",
      "GDB3437"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 950,
    "supplierListPrice": 950,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-39",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-39-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-fiesta-1-4-1-5-1-6",
        "modelName": "FIESTA 1.4 1.5 1.6",
        "engineId": "e-ford-fiesta-1-4-1-5-1-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2018,
        "yearRangeText": "2010 - 2018",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-39-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-2-de-1-5l",
        "modelName": "MAZDA 2 (DE) 1.5L",
        "engineId": "e-mazda-mazda-2-de-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2014,
        "yearRangeText": "2007 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-39-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-suzuki",
        "brandName": "Suzuki",
        "modelId": "m-suzuki-ertiga-1-4",
        "modelName": "ERTIGA 1.4",
        "engineId": "e-suzuki-ertiga-1-4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2016,
        "yearRangeText": "2013 - 2016",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-39-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-suzuki",
        "brandName": "Suzuki",
        "modelId": "m-suzuki-new-swift-1-2-glx-glx-navi",
        "modelName": "New SWIFT 1.2 GLX / GLX Navi",
        "engineId": "e-suzuki-new-swift-1-2-glx-glx-navi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-40",
    "sku": "P59 042N",
    "name": "Brembo Pad NAO P59 042N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "BPYK2648ZA",
      "GDB1621",
      "GDB7734"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1090,
    "supplierListPrice": 1090,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-40",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-40-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-focus-c307-1-6l-1-8l",
        "modelName": "FOCUS (C307) 1.6L 1.8L",
        "engineId": "e-ford-focus-c307-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2012,
        "yearRangeText": "2005 - 2012",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-40-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-focus-c346-1-6l-1-8l-2-0l",
        "modelName": "FOCUS (C346) 1.6L 1.8L 2.0L",
        "engineId": "e-ford-focus-c346-1-6l-1-8l-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-40-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-3-bk-1-6l-2-0l",
        "modelName": "MAZDA 3 (BK) 1.6L 2.0L",
        "engineId": "e-mazda-mazda-3-bk-1-6l-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2011,
        "yearRangeText": "2004 - 2011",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-40-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-3-bl-1-6l-2-0l",
        "modelName": "MAZDA 3 (BL) 1.6L 2.0L",
        "engineId": "e-mazda-mazda-3-bl-1-6l-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2014,
        "yearRangeText": "2011 - 2014",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-41",
    "sku": "P24 073B",
    "name": "Brembo Pad Low-M P24 073B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "2M502K021AA",
      "GDB1772"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1900,
    "supplierListPrice": 1900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-41",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-41-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-focus-rs-brembo-caliper",
        "modelName": "FOCUS RS (Brembo Caliper)",
        "engineId": "e-ford-focus-rs-brembo-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2004,
        "yearRangeText": "2002 - 2004",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-42",
    "sku": "P24 073N",
    "name": "Brembo Pad NAO P24 073N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "2M502K021AA",
      "GDB1772"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2200,
    "supplierListPrice": 2200,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-42",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-42-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-focus-rs-brembo-caliper",
        "modelName": "FOCUS RS (Brembo Caliper)",
        "engineId": "e-ford-focus-rs-brembo-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2004,
        "yearRangeText": "2002 - 2004",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-43",
    "sku": "P49 023B",
    "name": "Brembo Pad Low-M P49 023B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "GDB1139",
      "DB1362"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1500,
    "supplierListPrice": 1500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-43",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-43-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-laser-tierra-2-0l",
        "modelName": "LASER TIERRA 2.0L",
        "engineId": "e-ford-laser-tierra-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2004,
        "yearRangeText": "1998 - 2004",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-43-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-telstar-1-8l-2-0l",
        "modelName": "TELSTAR 1.8L 2.0L",
        "engineId": "e-ford-telstar-1-8l-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1992,
        "yearTo": 1996,
        "yearRangeText": "1992 - 1996",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-43-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-323-prot-g-1-8l-2-0l",
        "modelName": "MAZDA 323 Protégé 1.8L 2.0L",
        "engineId": "e-mazda-mazda-323-prot-g-1-8l-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2004,
        "yearRangeText": "1998 - 2004",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-44",
    "sku": "P24 051N",
    "name": "Brembo Pad NAO P24 051N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "UHY13328Z",
      "GDB3353",
      "DB1366"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1040,
    "supplierListPrice": 1040,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-44",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-44-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-2-5d-2-9d-2wd",
        "modelName": "RANGER 2.5D 2.9D 2WD",
        "engineId": "e-ford-ranger-2-5d-2-9d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2006,
        "yearRangeText": "1998 - 2006",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-44-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-2-5d-2-9d-2wd-hi-rider-4wd",
        "modelName": "RANGER 2.5D 2.9D 2WD Hi-Rider/4WD",
        "engineId": "e-ford-ranger-2-5d-2-9d-2wd-hi-rider-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2006,
        "yearRangeText": "1998 - 2006",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-45",
    "sku": "P24 153B",
    "name": "Brembo Pad Low-M P24 153B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "UCYE3323Z",
      "GDB7869",
      "DB2074"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1200,
    "supplierListPrice": 1200,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-45",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-45-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-t6-2-2d-3-2d-2wd",
        "modelName": "RANGER T6 2.2D 3.2D 2WD",
        "engineId": "e-ford-ranger-t6-2-2d-3-2d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2015,
        "yearRangeText": "2011 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-45-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-t6-3-2d-2wd-hi-rider-4wd",
        "modelName": "RANGER T6 3.2D 2WD Hi-Rider/4WD",
        "engineId": "e-ford-ranger-t6-3-2d-2wd-hi-rider-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2015,
        "yearRangeText": "2011 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-45-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-t6-2-0d-2-2d-3-2d-2wd-4wd",
        "modelName": "RANGER T6 2.0D 2.2D 3.2D 2WD/4WD",
        "engineId": "e-ford-ranger-t6-2-0d-2-2d-3-2d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2022,
        "yearRangeText": "2015 - 2022",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-45-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-bt-50-pro-2-2d-2wd",
        "modelName": "BT-50 PRO 2.2D 2WD",
        "engineId": "e-mazda-bt-50-pro-2-2d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2020,
        "yearRangeText": "2011 - 2020",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-45-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-bt-50-pro-3-2d-2wd-hi-racer-4wd",
        "modelName": "BT-50 PRO 3.2D 2WD Hi-Racer/4WD",
        "engineId": "e-mazda-bt-50-pro-3-2d-2wd-hi-racer-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2020,
        "yearRangeText": "2011 - 2020",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-46",
    "sku": "P24 153N",
    "name": "Brembo Pad NAO P24 153N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "UCYE3323Z",
      "GDB7869",
      "DB2074"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1370,
    "supplierListPrice": 1370,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-46",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-46-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-t6-2-2d-3-2d-2wd",
        "modelName": "RANGER T6 2.2D 3.2D 2WD",
        "engineId": "e-ford-ranger-t6-2-2d-3-2d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2015,
        "yearRangeText": "2011 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-46-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-t6-3-2d-2wd-hi-rider-4wd",
        "modelName": "RANGER T6 3.2D 2WD Hi-Rider/4WD",
        "engineId": "e-ford-ranger-t6-3-2d-2wd-hi-rider-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2015,
        "yearRangeText": "2011 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-46-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-ranger-t6-2-0d-2-2d-3-2d-2wd-4wd",
        "modelName": "RANGER T6 2.0D 2.2D 3.2D 2WD/4WD",
        "engineId": "e-ford-ranger-t6-2-0d-2-2d-3-2d-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2022,
        "yearRangeText": "2015 - 2022",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-46-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-bt-50-pro-2-2d-2wd",
        "modelName": "BT-50 PRO 2.2D 2WD",
        "engineId": "e-mazda-bt-50-pro-2-2d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2020,
        "yearRangeText": "2011 - 2020",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-46-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-bt-50-pro-3-2d-2wd-hi-racer-4wd",
        "modelName": "BT-50 PRO 3.2D 2WD Hi-Racer/4WD",
        "engineId": "e-mazda-bt-50-pro-3-2d-2wd-hi-racer-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2020,
        "yearRangeText": "2011 - 2020",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-47",
    "sku": "P24 227N",
    "name": "Brembo Pad NAO P24 227N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "FR3Z2001A"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 4500,
    "supplierListPrice": 4500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-47",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-47-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-mustang-2-3-ecoboost-5-0-gt",
        "modelName": "MUSTANG 2.3 Ecoboost 5.0 GT",
        "engineId": "e-ford-mustang-2-3-ecoboost-5-0-gt",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2018,
        "yearRangeText": "2014 - 2018",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-48",
    "sku": "P24 232N",
    "name": "Brembo Pad NAO P24 232N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "FR3Z2200C / FR3Z2200G"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2300,
    "supplierListPrice": 2300,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-48",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-48-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ford",
        "brandName": "Ford",
        "modelId": "m-ford-mustang-2-3-ecoboost-5-0-gt",
        "modelName": "MUSTANG 2.3 Ecoboost 5.0 GT",
        "engineId": "e-ford-mustang-2-3-ecoboost-5-0-gt",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2018,
        "yearRangeText": "2014 - 2018",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-49",
    "sku": "P49 055N",
    "name": "Brembo Pad NAO P49 055N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "DBY13328ZA",
      "GDB7990",
      "DB2334"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1170,
    "supplierListPrice": 1170,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-49",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-49-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-2-dj-1-3l-1-5d-xd-skyactiv",
        "modelName": "MAZDA 2 (DJ) 1.3L 1.5D XD SkyActiv",
        "engineId": "e-mazda-mazda-2-dj-1-3l-1-5d-xd-skyactiv",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-49-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-2-dj-1-5d-xd-high-skyactiv",
        "modelName": "MAZDA 2 (DJ) 1.5D XD High SkyActiv",
        "engineId": "e-mazda-mazda-2-dj-1-5d-xd-high-skyactiv",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-49-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-almera-n18t",
        "modelName": "ALMERA N18T",
        "engineId": "e-nissan-almera-n18t",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-49-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-kicks-p15",
        "modelName": "KICKS P15",
        "engineId": "e-nissan-kicks-p15",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-50",
    "sku": "P49 047N",
    "name": "Brembo Pad NAO P49 047N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "DAY32648ZA",
      "GDB3539",
      "DB2227"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1030,
    "supplierListPrice": 1030,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-50",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-50-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-2-dj-1-5d-xd-high-skyactiv",
        "modelName": "MAZDA 2 (DJ) 1.5D XD High SkyActiv",
        "engineId": "e-mazda-mazda-2-dj-1-5d-xd-high-skyactiv",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-50-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-3-dk-1-5d-2-0l-skyactiv",
        "modelName": "CX-3 (DK) 1.5D 2.0L SkyActiv",
        "engineId": "e-mazda-cx-3-dk-1-5d-2-0l-skyactiv",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2020,
        "yearRangeText": "2015 - 2020",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-50-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-5-ke-2-0l-2-2d-skyactiv-2wd-4wd",
        "modelName": "CX-5 (KE) 2.0L 2.2D SkyActiv 2WD/4WD",
        "engineId": "e-mazda-cx-5-ke-2-0l-2-2d-skyactiv-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2016,
        "yearRangeText": "2013 - 2016",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-51",
    "sku": "P49 050N",
    "name": "Brembo Pad NAO P49 050N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "B4Y03328ZA",
      "GDB3592",
      "DB2330"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1330,
    "supplierListPrice": 1330,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-51",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-51-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-3-bm-2-0l-skyactiv",
        "modelName": "MAZDA 3 (BM) 2.0L SkyActiv",
        "engineId": "e-mazda-mazda-3-bm-2-0l-skyactiv",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2017,
        "yearRangeText": "2014 - 2017",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-51-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-3-bn-2-0l-skyactiv-epb",
        "modelName": "MAZDA 3 (BN) 2.0L SkyActiv (EPB เบรกมือไฟฟ้า)",
        "engineId": "e-mazda-mazda-3-bn-2-0l-skyactiv-epb",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearTo": 2019,
        "yearRangeText": "2017 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-51-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-3-dk-1-5d-2-0l-skyactiv",
        "modelName": "CX-3 (DK) 1.5D 2.0L SkyActiv",
        "engineId": "e-mazda-cx-3-dk-1-5d-2-0l-skyactiv",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2020,
        "yearRangeText": "2015 - 2020",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-51-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-3-dk-2-0l-skyactiv",
        "modelName": "CX-3 (DK) 2.0L SkyActiv",
        "engineId": "e-mazda-cx-3-dk-2-0l-skyactiv",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-51-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-30-dm-2-0l-skyactiv",
        "modelName": "CX-30 (DM) 2.0L SkyActiv",
        "engineId": "e-mazda-cx-30-dm-2-0l-skyactiv",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-52",
    "sku": "P49 049N",
    "name": "Brembo Pad NAO P49 049N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "B4Y02648ZA",
      "GDB3593",
      "DB2331"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1010,
    "supplierListPrice": 1010,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-52",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-52-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-3-bm-2-0l-skyactiv",
        "modelName": "MAZDA 3 (BM) 2.0L SkyActiv",
        "engineId": "e-mazda-mazda-3-bm-2-0l-skyactiv",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2017,
        "yearRangeText": "2014 - 2017",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-53",
    "sku": "P49 063N",
    "name": "Brembo Pad NAO P49 063N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "BAY02643ZA",
      "GDB8971"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1610,
    "supplierListPrice": 1610,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-53",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-53-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-3-bn-2-0l-skyactiv-epb",
        "modelName": "MAZDA 3 (BN) 2.0L SkyActiv (EPB เบรกมือไฟฟ้า)",
        "engineId": "e-mazda-mazda-3-bn-2-0l-skyactiv-epb",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearTo": 2019,
        "yearRangeText": "2017 - 2019",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-53-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-3-dk-2-0l-skyactiv",
        "modelName": "CX-3 (DK) 2.0L SkyActiv",
        "engineId": "e-mazda-cx-3-dk-2-0l-skyactiv",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-54",
    "sku": "P49 065N",
    "name": "Brembo Pad NAO P49 065N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "BCYA3328ZB / BCYA3328ZA"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2010,
    "supplierListPrice": 2010,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-54",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-54-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-3-bp-2-0l",
        "modelName": "MAZDA 3 (BP) 2.0L",
        "engineId": "e-mazda-mazda-3-bp-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-55",
    "sku": "P49 064N",
    "name": "Brembo Pad NAO P49 064N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "BCYA2643Z",
      "GDB8314"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1400,
    "supplierListPrice": 1400,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-55",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-55-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-3-bp-2-0l",
        "modelName": "MAZDA 3 (BP) 2.0L",
        "engineId": "e-mazda-mazda-3-bp-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-55-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-30-dm-2-0l-skyactiv",
        "modelName": "CX-30 (DM) 2.0L SkyActiv",
        "engineId": "e-mazda-cx-30-dm-2-0l-skyactiv",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-56",
    "sku": "P49 027B",
    "name": "Brembo Pad Low-M P49 027B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "BJYD3323Z / 1U1H3328Z",
      "GDB3193",
      "DB1358"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1200,
    "supplierListPrice": 1200,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-56",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-56-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mazda-323-prot-g-bj-1-6l",
        "modelName": "MAZDA 323 Protégé BJ 1.6L",
        "engineId": "e-mazda-mazda-323-prot-g-bj-1-6l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2004,
        "yearRangeText": "1998 - 2004",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-57",
    "sku": "P49 045B",
    "name": "Brembo Pad Low-M P49 045B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "K0Y13323Z",
      "GDB3562",
      "DB2226"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1500,
    "supplierListPrice": 1500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-57",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-57-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-5-ke-2-0l-2-2d-skyactiv-2wd-4wd",
        "modelName": "CX-5 (KE) 2.0L 2.2D SkyActiv 2WD/4WD",
        "engineId": "e-mazda-cx-5-ke-2-0l-2-2d-skyactiv-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2016,
        "yearRangeText": "2013 - 2016",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-57-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-5-ke-2-0l-2-2d-skyactiv-epb-2wd-4wd",
        "modelName": "CX-5 (KE) 2.0L 2.2D SkyActiv (EPB เบรกมือไฟฟ้า) 2WD/4WD",
        "engineId": "e-mazda-cx-5-ke-2-0l-2-2d-skyactiv-epb-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearTo": 2017,
        "yearRangeText": "2016 - 2017",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-57-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-5-kf-2-0l-2-2d-2-5l-turbo-skyactiv-2wd-4wd",
        "modelName": "CX-5 (KF) 2.0L 2.2D 2.5L Turbo SkyActiv 2WD/4WD",
        "engineId": "e-mazda-cx-5-kf-2-0l-2-2d-2-5l-turbo-skyactiv-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-58",
    "sku": "P49 045N",
    "name": "Brembo Pad NAO P49 045N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "K0Y13323Z",
      "GDB3562",
      "DB2226"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1510,
    "supplierListPrice": 1510,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-58",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-58-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-5-ke-2-0l-2-2d-skyactiv-2wd-4wd",
        "modelName": "CX-5 (KE) 2.0L 2.2D SkyActiv 2WD/4WD",
        "engineId": "e-mazda-cx-5-ke-2-0l-2-2d-skyactiv-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2016,
        "yearRangeText": "2013 - 2016",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-58-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-5-ke-2-0l-2-2d-skyactiv-epb-2wd-4wd",
        "modelName": "CX-5 (KE) 2.0L 2.2D SkyActiv (EPB เบรกมือไฟฟ้า) 2WD/4WD",
        "engineId": "e-mazda-cx-5-ke-2-0l-2-2d-skyactiv-epb-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearTo": 2017,
        "yearRangeText": "2016 - 2017",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-58-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-5-kf-2-0l-2-2d-2-5l-turbo-skyactiv-2wd-4wd",
        "modelName": "CX-5 (KF) 2.0L 2.2D 2.5L Turbo SkyActiv 2WD/4WD",
        "engineId": "e-mazda-cx-5-kf-2-0l-2-2d-2-5l-turbo-skyactiv-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-59",
    "sku": "P49 053B",
    "name": "Brembo Pad Low-M P49 053B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "KAY02648Z",
      "GDB8090",
      "GDB2163"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1550,
    "supplierListPrice": 1550,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-59",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-59-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-5-ke-2-0l-2-2d-skyactiv-epb-2wd-4wd",
        "modelName": "CX-5 (KE) 2.0L 2.2D SkyActiv (EPB เบรกมือไฟฟ้า) 2WD/4WD",
        "engineId": "e-mazda-cx-5-ke-2-0l-2-2d-skyactiv-epb-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearTo": 2017,
        "yearRangeText": "2016 - 2017",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-59-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-5-kf-2-0l-2-2d-2-5l-turbo-skyactiv-2wd-4wd",
        "modelName": "CX-5 (KF) 2.0L 2.2D 2.5L Turbo SkyActiv 2WD/4WD",
        "engineId": "e-mazda-cx-5-kf-2-0l-2-2d-2-5l-turbo-skyactiv-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-59-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mx-5-nd-1-5-2-0-160hp",
        "modelName": "MX-5 ND 1.5 / 2.0 (160hp)",
        "engineId": "e-mazda-mx-5-nd-1-5-2-0-160hp",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-60",
    "sku": "P49 053N",
    "name": "Brembo Pad NAO P49 053N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "KAY02648Z",
      "GDB8090",
      "GDB2163"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1650,
    "supplierListPrice": 1650,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-60",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-60-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-5-ke-2-0l-2-2d-skyactiv-epb-2wd-4wd",
        "modelName": "CX-5 (KE) 2.0L 2.2D SkyActiv (EPB เบรกมือไฟฟ้า) 2WD/4WD",
        "engineId": "e-mazda-cx-5-ke-2-0l-2-2d-skyactiv-epb-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearTo": 2017,
        "yearRangeText": "2016 - 2017",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-60-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-5-kf-2-0l-2-2d-2-5l-turbo-skyactiv-2wd-4wd",
        "modelName": "CX-5 (KF) 2.0L 2.2D 2.5L Turbo SkyActiv 2WD/4WD",
        "engineId": "e-mazda-cx-5-kf-2-0l-2-2d-2-5l-turbo-skyactiv-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-60-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mx-5-nd-1-5-2-0-160hp",
        "modelName": "MX-5 ND 1.5 / 2.0 (160hp)",
        "engineId": "e-mazda-mx-5-nd-1-5-2-0-160hp",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-61",
    "sku": "P54 059N",
    "name": "Brembo Pad NAO P54 059N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4605B541",
      "GDB8027",
      "DB1916",
      "GDB3471"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1260,
    "supplierListPrice": 1260,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-61",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-61-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-7",
        "modelName": "CX-7",
        "engineId": "e-mazda-cx-7",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2017,
        "yearRangeText": "2013 - 2017",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-61-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-8-kg-2-2d-2-5l",
        "modelName": "CX-8 (KG) 2.2D 2.5L",
        "engineId": "e-mazda-cx-8-kg-2-2d-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-61-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-9",
        "modelName": "CX-9",
        "engineId": "e-mazda-cx-9",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2017,
        "yearRangeText": "2013 - 2017",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-61-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-triton-2-5d-2wd",
        "modelName": "TRITON 2.5D 2WD",
        "engineId": "e-mitsubishi-triton-2-5d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-61-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-triton-2-4d-2wd-plus-4wd",
        "modelName": "TRITON 2.4D 2WD Plus / 4WD",
        "engineId": "e-mitsubishi-triton-2-4d-2wd-plus-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-61-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-pajero-sport-4x2-4x4-2-4d",
        "modelName": "PAJERO SPORT 4x2 4x4 2.4D",
        "engineId": "e-mitsubishi-pajero-sport-4x2-4x4-2-4d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-62",
    "sku": "P49 062N",
    "name": "Brembo Pad NAO P49 062N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "TKY82648ZA",
      "GDB2199"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1800,
    "supplierListPrice": 1800,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-62",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-62-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-cx-8-kg-2-2d-2-5l",
        "modelName": "CX-8 (KG) 2.2D 2.5L",
        "engineId": "e-mazda-cx-8-kg-2-2d-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-63",
    "sku": "P49 017N",
    "name": "Brembo Pad NAO P49 017N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "1U143328Z",
      "GDB1028",
      "DB1178"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1800,
    "supplierListPrice": 1800,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-63",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-63-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mx-5-na-1-6",
        "modelName": "MX-5 NA 1.6",
        "engineId": "e-mazda-mx-5-na-1-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1990,
        "yearTo": 1994,
        "yearRangeText": "1990 - 1994",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-64",
    "sku": "P49 020N",
    "name": "Brembo Pad NAO P49 020N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "1U163328Z",
      "GDB3103",
      "DB1282"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1900,
    "supplierListPrice": 1900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-64",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-64-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mx-5-na-1-8-nb-1-8",
        "modelName": "MX-5 NA 1.8 / NB 1.8",
        "engineId": "e-mazda-mx-5-na-1-8-nb-1-8",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 2005,
        "yearRangeText": "1993 - 2005",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-65",
    "sku": "P49 029N",
    "name": "Brembo Pad NAO P49 029N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "N0Y73328Z",
      "GDB3302",
      "DB1386"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1700,
    "supplierListPrice": 1700,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-65",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-65-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mx-5-nb-1-8-1-8t",
        "modelName": "MX-5 NB 1.8 1.8T",
        "engineId": "e-mazda-mx-5-nb-1-8-1-8t",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2005,
        "yearRangeText": "1998 - 2005",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-66",
    "sku": "P49 030N",
    "name": "Brembo Pad NAO P49 030N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "N0Y72648ZA",
      "GDB3303"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1200,
    "supplierListPrice": 1200,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-66",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-66-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mx-5-nb-1-8",
        "modelName": "MX-5 NB 1.8",
        "engineId": "e-mazda-mx-5-nb-1-8",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2005,
        "yearRangeText": "1998 - 2005",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-67",
    "sku": "P49 031N",
    "name": "Brembo Pad NAO P49 031N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "N0Y7648ZA",
      "GDB3318",
      "DB1508"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1100,
    "supplierListPrice": 1100,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-67",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-67-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mx-5-nb-1-8",
        "modelName": "MX-5 NB 1.8",
        "engineId": "e-mazda-mx-5-nb-1-8",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2005,
        "yearRangeText": "1998 - 2005",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-68",
    "sku": "P49 043N",
    "name": "Brembo Pad NAO P49 043N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "NF7Y3323Z",
      "GDB3401",
      "DB2063"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1750,
    "supplierListPrice": 1750,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-68",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-68-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mx-5-nc-2-0",
        "modelName": "MX-5 NC 2.0",
        "engineId": "e-mazda-mx-5-nc-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2014,
        "yearRangeText": "2005 - 2014",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-69",
    "sku": "P49 054B",
    "name": "Brembo Pad Low-M P49 054B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "N2Y33328ZA",
      "GDB2200"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2100,
    "supplierListPrice": 2100,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-69",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-69-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mx-5-nd-1-5-2-0-160hp-184hp",
        "modelName": "MX-5 ND 1.5 / 2.0 (160hp 184hp)",
        "engineId": "e-mazda-mx-5-nd-1-5-2-0-160hp-184hp",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-70",
    "sku": "P49 054N",
    "name": "Brembo Pad NAO P49 054N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "N2Y33328ZA",
      "GDB2200"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2500,
    "supplierListPrice": 2500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-70",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-70-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mx-5-nd-1-5-2-0-160hp-184hp",
        "modelName": "MX-5 ND 1.5 / 2.0 (160hp 184hp)",
        "engineId": "e-mazda-mx-5-nd-1-5-2-0-160hp-184hp",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-71",
    "sku": "P49 044N",
    "name": "Brembo Pad NAO P49 044N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "N1Y32643ZA",
      "GDB3402",
      "DB2064"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1600,
    "supplierListPrice": 1600,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-71",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-71-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-mx-5-nc-2-0-nd-2-0-160hp-184hp",
        "modelName": "MX-5 NC 2.0 / ND 2.0 (160hp 184hp)",
        "engineId": "e-mazda-mx-5-nc-2-0-nd-2-0-160hp-184hp",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearRangeText": "2005-2014, 2015->",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-72",
    "sku": "P49 034N",
    "name": "Brembo Pad NAO P49 034N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "F1Y13323ZB",
      "GDB3356"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1940,
    "supplierListPrice": 1940,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-72",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-72-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-rx-8",
        "modelName": "RX-8",
        "engineId": "e-mazda-rx-8",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2012,
        "yearRangeText": "2003 - 2012",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-73",
    "sku": "P49 035N",
    "name": "Brembo Pad NAO P49 035N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "F1Y02648Z"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-73",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-73-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mazda",
        "brandName": "Mazda",
        "modelId": "m-mazda-rx-8",
        "modelName": "RX-8",
        "engineId": "e-mazda-rx-8",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2012,
        "yearRangeText": "2003 - 2012",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-74",
    "sku": "P28 089N",
    "name": "Brembo Pad NAO P28 089N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022TBAA02",
      "GDB8032",
      "DB2429"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 840,
    "supplierListPrice": 840,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-74",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-74-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-haval",
        "brandName": "Haval",
        "modelId": "m-haval-h6-1-5-20",
        "modelName": "H6 1.5 (ปี20)",
        "engineId": "e-haval-h6-1-5-20",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-74-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fc-fk-1-5t-1-8l",
        "modelName": "CIVIC (FC, FK) 1.5T 1.8L",
        "engineId": "e-honda-civic-fc-fk-1-5t-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearTo": 2021,
        "yearRangeText": "2016 - 2021",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-74-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fe-1-5t",
        "modelName": "CIVIC (FE) 1.5T",
        "engineId": "e-honda-civic-fe-1-5t",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2021,
        "yearRangeText": "2021 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-75",
    "sku": "P28 086N",
    "name": "Brembo Pad NAO P28 086N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022SJA050"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-75",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-75-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-acura-rl",
        "modelName": "ACURA RL (รถนอก)",
        "engineId": "e-honda-acura-rl",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2012,
        "yearRangeText": "2005 - 2012",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-76",
    "sku": "P28 042N",
    "name": "Brembo Pad NAO P28 042N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022SM4A00",
      "GDB894",
      "DB1191"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1280,
    "supplierListPrice": 1280,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-76",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-76-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen5-2-0l-2-2l-vtec-lxi-exi-vti-l",
        "modelName": "ACCORD Gen5 2.0L 2.2L VTEC LXi/EXi/VTi-L",
        "engineId": "e-honda-accord-gen5-2-0l-2-2l-vtec-lxi-exi-vti-l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1994,
        "yearTo": 1997,
        "yearRangeText": "1994 - 1997",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-76-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen6-2-3l-vtec",
        "modelName": "ACCORD Gen6 2.3L VTEC",
        "engineId": "e-honda-accord-gen6-2-3l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2002,
        "yearRangeText": "1998 - 2002",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-76-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen1-2-0l",
        "modelName": "CR-V (Gen1) 2.0L",
        "engineId": "e-honda-cr-v-gen1-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1994,
        "yearTo": 2002,
        "yearRangeText": "1994 - 2002",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-77",
    "sku": "P79 027N",
    "name": "Brembo Pad NAO P79 027N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022SV4020",
      "GDB3175",
      "DB1265",
      "GDB3191"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 850,
    "supplierListPrice": 850,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-77",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-77-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen5-2-0l-2-2l-vtec-lxi-exi-vti-l",
        "modelName": "ACCORD Gen5 2.0L 2.2L VTEC LXi/EXi/VTi-L",
        "engineId": "e-honda-accord-gen5-2-0l-2-2l-vtec-lxi-exi-vti-l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1994,
        "yearTo": 1997,
        "yearRangeText": "1994 - 1997",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen5-2-2l-vti-s",
        "modelName": "ACCORD Gen5 2.2L VTi-s",
        "engineId": "e-honda-accord-gen5-2-2l-vti-s",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1994,
        "yearTo": 1997,
        "yearRangeText": "1994 - 1997",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen6-2-3l-vtec",
        "modelName": "ACCORD Gen6 2.3L VTEC",
        "engineId": "e-honda-accord-gen6-2-3l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2002,
        "yearRangeText": "1998 - 2002",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen7-2-0l-2-4l-3-0l-vq",
        "modelName": "ACCORD Gen7 2.0L 2.4L 3.0L VQ",
        "engineId": "e-honda-accord-gen7-2-0l-2-4l-3-0l-vq",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2007,
        "yearRangeText": "2003 - 2007",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-dimension-1-7l-2-0l-vtec",
        "modelName": "CIVIC (Dimension) 1.7L 2.0L VTEC",
        "engineId": "e-honda-civic-dimension-1-7l-2-0l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2005,
        "yearRangeText": "2000 - 2005",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fd-1-8l",
        "modelName": "CIVIC (FD) 1.8L",
        "engineId": "e-honda-civic-fd-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2012,
        "yearRangeText": "2006 - 2012",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-6",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fd-2-0l",
        "modelName": "CIVIC (FD) 2.0L",
        "engineId": "e-honda-civic-fd-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2012,
        "yearRangeText": "2006 - 2012",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-7",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fb-s-e-1-8l",
        "modelName": "CIVIC (FB) S/E 1.8L",
        "engineId": "e-honda-civic-fb-s-e-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2015,
        "yearRangeText": "2012 - 2015",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-8",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fb-el-2-0l",
        "modelName": "CIVIC (FB) EL 2.0L",
        "engineId": "e-honda-civic-fb-el-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2015,
        "yearRangeText": "2012 - 2015",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-9",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen1-2-0l",
        "modelName": "CR-V (Gen1) 2.0L",
        "engineId": "e-honda-cr-v-gen1-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1994,
        "yearTo": 2002,
        "yearRangeText": "1994 - 2002",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-10",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-integra-dc5-2-0-type-r",
        "modelName": "INTEGRA DC5 2.0 Type-R",
        "engineId": "e-honda-integra-dc5-2-0-type-r",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearRangeText": "2001 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-11",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-odyssey-2-0l-2-2l",
        "modelName": "ODYSSEY 2.0L 2.2L",
        "engineId": "e-honda-odyssey-2-0l-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1995,
        "yearTo": 1999,
        "yearRangeText": "1995 - 1999",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-12",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-stepwgn-2-0l",
        "modelName": "STEPWGN 2.0L",
        "engineId": "e-honda-stepwgn-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1996,
        "yearTo": 2005,
        "yearRangeText": "1996 - 2005",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-77-13",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-stream-rn-2-0l",
        "modelName": "STREAM (RN) 2.0L",
        "engineId": "e-honda-stream-rn-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2003,
        "yearRangeText": "2002 - 2003",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-78",
    "sku": "P28 021B",
    "name": "Brembo Pad Low-M P28 021B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022SN7G42",
      "GDB1061",
      "DB1268"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1300,
    "supplierListPrice": 1300,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-78",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-78-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen5-2-2l-vti-s",
        "modelName": "ACCORD Gen5 2.2L VTi-s",
        "engineId": "e-honda-accord-gen5-2-2l-vti-s",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1994,
        "yearTo": 1997,
        "yearRangeText": "1994 - 1997",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-78-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen6-2-4l",
        "modelName": "ACCORD Gen6 2.4L",
        "engineId": "e-honda-accord-gen6-2-4l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2002,
        "yearRangeText": "1998 - 2002",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-79",
    "sku": "P28 021N",
    "name": "Brembo Pad NAO P28 021N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022SN7G42",
      "GDB1061",
      "DB1268"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1370,
    "supplierListPrice": 1370,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-79",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-79-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen5-2-2l-vti-s",
        "modelName": "ACCORD Gen5 2.2L VTi-s",
        "engineId": "e-honda-accord-gen5-2-2l-vti-s",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1994,
        "yearTo": 1997,
        "yearRangeText": "1994 - 1997",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-79-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen6-2-4l",
        "modelName": "ACCORD Gen6 2.4L",
        "engineId": "e-honda-accord-gen6-2-4l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2002,
        "yearRangeText": "1998 - 2002",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-80",
    "sku": "P28 039N",
    "name": "Brembo Pad NAO P28 039N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022S9AE51",
      "GDB3154",
      "DB1230"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 940,
    "supplierListPrice": 940,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-80",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-80-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen6-2-4l",
        "modelName": "ACCORD Gen6 2.4L",
        "engineId": "e-honda-accord-gen6-2-4l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2002,
        "yearRangeText": "1998 - 2002",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-80-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen6-3-0l",
        "modelName": "ACCORD Gen6 3.0L",
        "engineId": "e-honda-accord-gen6-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2002,
        "yearRangeText": "1998 - 2002",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-80-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen2-2-0l-2-4l-2wd",
        "modelName": "CR-V (Gen2) 2.0L 2.4L 2WD",
        "engineId": "e-honda-cr-v-gen2-2-0l-2-4l-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-80-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-stream-2-0l",
        "modelName": "STREAM 2.0L",
        "engineId": "e-honda-stream-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2007,
        "yearRangeText": "2003 - 2007",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-81",
    "sku": "P28 026N",
    "name": "Brembo Pad NAO P28 026N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022S10G01",
      "GDB995",
      "DB1206"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1370,
    "supplierListPrice": 1370,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-81",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-81-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen6-3-0l",
        "modelName": "ACCORD Gen6 3.0L",
        "engineId": "e-honda-accord-gen6-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2002,
        "yearRangeText": "1998 - 2002",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-81-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-integra-dc2",
        "modelName": "INTEGRA DC2",
        "engineId": "e-honda-integra-dc2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1991,
        "yearRangeText": "1991 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-81-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-nsx-3-0",
        "modelName": "NSX 3.0",
        "engineId": "e-honda-nsx-3-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearRangeText": "1993 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-81-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-odyssey-2-0l-2-2l",
        "modelName": "ODYSSEY 2.0L 2.2L",
        "engineId": "e-honda-odyssey-2-0l-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1995,
        "yearTo": 1999,
        "yearRangeText": "1995 - 1999",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-81-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-odyssey-2-0l-2-3l-2-4l-3-0l",
        "modelName": "ODYSSEY 2.0L 2.3L 2.4L 3.0L",
        "engineId": "e-honda-odyssey-2-0l-2-3l-2-4l-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2005,
        "yearRangeText": "2000 - 2005",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-81-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-prelude-2-0l-2-2l-2-3l",
        "modelName": "PRELUDE 2.0L 2.2L 2.3L",
        "engineId": "e-honda-prelude-2-0l-2-2l-2-3l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1991,
        "yearTo": 1998,
        "yearRangeText": "1991 - 1998",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-81-6",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-stepwgn-2-0l",
        "modelName": "STEPWGN 2.0L",
        "engineId": "e-honda-stepwgn-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1996,
        "yearTo": 2005,
        "yearRangeText": "1996 - 2005",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-82",
    "sku": "P28 047N",
    "name": "Brembo Pad NAO P28 047N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022SDAC00 / 45022SDDA10",
      "GDB3268"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1230,
    "supplierListPrice": 1230,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-82",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-82-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen7-2-0l-2-4l-3-0l-vq",
        "modelName": "ACCORD Gen7 2.0L 2.4L 3.0L VQ",
        "engineId": "e-honda-accord-gen7-2-0l-2-4l-3-0l-vq",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2007,
        "yearRangeText": "2003 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-82-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen8-2-0l-2-4l-3-5l",
        "modelName": "ACCORD Gen8 2.0L 2.4L 3.5L",
        "engineId": "e-honda-accord-gen8-2-0l-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2012,
        "yearRangeText": "2008 - 2012",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-82-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fd-2-0l",
        "modelName": "CIVIC (FD) 2.0L",
        "engineId": "e-honda-civic-fd-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2012,
        "yearRangeText": "2006 - 2012",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-82-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fb-el-2-0l",
        "modelName": "CIVIC (FB) EL 2.0L",
        "engineId": "e-honda-civic-fb-el-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2015,
        "yearRangeText": "2012 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-82-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-stepwgn-rg-2-0l",
        "modelName": "STEPWGN (RG) 2.0L",
        "engineId": "e-honda-stepwgn-rg-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2009,
        "yearRangeText": "2005 - 2009",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-82-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-stream-rn-2-0l",
        "modelName": "STREAM (RN) 2.0L",
        "engineId": "e-honda-stream-rn-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2003,
        "yearRangeText": "2002 - 2003",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-82-6",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-stream-2-0l",
        "modelName": "STREAM 2.0L",
        "engineId": "e-honda-stream-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2007,
        "yearRangeText": "2003 - 2007",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-83",
    "sku": "P28 072B",
    "name": "Brembo Pad Low-M P28 072B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022TA0A00",
      "GDB7920",
      "DB1953"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 950,
    "supplierListPrice": 950,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-83",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-83-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen8-2-0l-2-4l-3-5l",
        "modelName": "ACCORD Gen8 2.0L 2.4L 3.5L",
        "engineId": "e-honda-accord-gen8-2-0l-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2012,
        "yearRangeText": "2008 - 2012",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-84",
    "sku": "P28 072N",
    "name": "Brembo Pad NAO P28 072N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022TA0A00",
      "GDB7920",
      "DB1953"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 990,
    "supplierListPrice": 990,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-84",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-84-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen8-2-0l-2-4l-3-5l",
        "modelName": "ACCORD Gen8 2.0L 2.4L 3.5L",
        "engineId": "e-honda-accord-gen8-2-0l-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2012,
        "yearRangeText": "2008 - 2012",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-85",
    "sku": "P28 077B",
    "name": "Brembo Pad Low-M P28 077B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022T2GA01",
      "GDB7901",
      "DB2304"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 900,
    "supplierListPrice": 900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-85",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-85-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen9-2-0l-2-4l-hybrid",
        "modelName": "ACCORD Gen9 2.0L 2.4L Hybrid",
        "engineId": "e-honda-accord-gen9-2-0l-2-4l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2018,
        "yearRangeText": "2013 - 2018",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-85-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen10-1-5l-turbo",
        "modelName": "ACCORD Gen10 1.5L Turbo",
        "engineId": "e-honda-accord-gen10-1-5l-turbo",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-85-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-hr-v-1-8l",
        "modelName": "HR-V 1.8L",
        "engineId": "e-honda-hr-v-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2021,
        "yearRangeText": "2014 - 2021",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-86",
    "sku": "P28 077N",
    "name": "Brembo Pad NAO P28 077N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022T2GA01",
      "GDB7901",
      "DB2304"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 960,
    "supplierListPrice": 960,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-86",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-86-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen9-2-0l-2-4l-hybrid",
        "modelName": "ACCORD Gen9 2.0L 2.4L Hybrid",
        "engineId": "e-honda-accord-gen9-2-0l-2-4l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2018,
        "yearRangeText": "2013 - 2018",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-86-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen10-1-5l-turbo",
        "modelName": "ACCORD Gen10 1.5L Turbo",
        "engineId": "e-honda-accord-gen10-1-5l-turbo",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-86-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-hr-v-1-8l",
        "modelName": "HR-V 1.8L",
        "engineId": "e-honda-hr-v-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2021,
        "yearRangeText": "2014 - 2021",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-87",
    "sku": "P28 051B",
    "name": "Brembo Pad Low-M P28 051B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022S9A010",
      "GDB3438",
      "DB1728"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 900,
    "supplierListPrice": 900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-87",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-87-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen9-2-0l-2-4l-hybrid",
        "modelName": "ACCORD Gen9 2.0L 2.4L Hybrid",
        "engineId": "e-honda-accord-gen9-2-0l-2-4l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2018,
        "yearRangeText": "2013 - 2018",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-87-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen3-2-0l-2-4l-2wd-awd",
        "modelName": "CR-V (Gen3) 2.0L 2.4L 2WD/AWD",
        "engineId": "e-honda-cr-v-gen3-2-0l-2-4l-2wd-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2012,
        "yearRangeText": "2008 - 2012",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-87-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen4-2-0l-2-4l-2wd-awd",
        "modelName": "CR-V (Gen4) 2.0L 2.4L 2WD/AWD",
        "engineId": "e-honda-cr-v-gen4-2-0l-2-4l-2wd-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2016,
        "yearRangeText": "2012 - 2016",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-87-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-stepwgn-spada-rk-2-0l",
        "modelName": "STEPWGN SPADA (RK) 2.0L",
        "engineId": "e-honda-stepwgn-spada-rk-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2014,
        "yearRangeText": "2009 - 2014",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-88",
    "sku": "P28 051N",
    "name": "Brembo Pad NAO P28 051N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022S9A010",
      "GDB3438",
      "DB1728"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 970,
    "supplierListPrice": 970,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-88",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-88-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen9-2-0l-2-4l-hybrid",
        "modelName": "ACCORD Gen9 2.0L 2.4L Hybrid",
        "engineId": "e-honda-accord-gen9-2-0l-2-4l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2018,
        "yearRangeText": "2013 - 2018",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-88-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen3-2-0l-2-4l-2wd-awd",
        "modelName": "CR-V (Gen3) 2.0L 2.4L 2WD/AWD",
        "engineId": "e-honda-cr-v-gen3-2-0l-2-4l-2wd-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2012,
        "yearRangeText": "2008 - 2012",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-88-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen4-2-0l-2-4l-2wd-awd",
        "modelName": "CR-V (Gen4) 2.0L 2.4L 2WD/AWD",
        "engineId": "e-honda-cr-v-gen4-2-0l-2-4l-2wd-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2016,
        "yearRangeText": "2012 - 2016",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-88-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-stepwgn-spada-rk-2-0l",
        "modelName": "STEPWGN SPADA (RK) 2.0L",
        "engineId": "e-honda-stepwgn-spada-rk-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2014,
        "yearRangeText": "2009 - 2014",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-89",
    "sku": "P28 107N",
    "name": "Brembo Pad NAO P28 107N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022TVEH00",
      "GDB8165"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1790,
    "supplierListPrice": 1790,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-89",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-89-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen10-1-5l-turbo",
        "modelName": "ACCORD Gen10 1.5L Turbo",
        "engineId": "e-honda-accord-gen10-1-5l-turbo",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-89-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen10-2-0-hybrid",
        "modelName": "ACCORD Gen10 2.0 Hybrid",
        "engineId": "e-honda-accord-gen10-2-0-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-90",
    "sku": "P28 104N",
    "name": "Brembo Pad NAO P28 104N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022TVCA02",
      "GDB8285"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1850,
    "supplierListPrice": 1850,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-90",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-90-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-accord-gen10-2-0-hybrid",
        "modelName": "ACCORD Gen10 2.0 Hybrid",
        "engineId": "e-honda-accord-gen10-2-0-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-91",
    "sku": "P28 024B",
    "name": "Brembo Pad Low-M P28 024B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022504G00",
      "GDB8008",
      "DB1262",
      "GDB1164"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 840,
    "supplierListPrice": 840,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-91",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-91-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-brio-1-2l",
        "modelName": "BRIO 1.2L",
        "engineId": "e-honda-brio-1-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-91-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-1-5l-i-dsi",
        "modelName": "CITY 1.5L i-DSI",
        "engineId": "e-honda-city-1-5l-i-dsi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-91-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-1-5l-vtec",
        "modelName": "CITY 1.5L VTEC",
        "engineId": "e-honda-city-1-5l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-91-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-3-4-1-3l-1-5l-1-6l-lxi-exi",
        "modelName": "CIVIC (เตารีด) 3,4 ประตู 1.3L 1.5L 1.6L LXi Exi",
        "engineId": "e-honda-civic-3-4-1-3l-1-5l-1-6l-lxi-exi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1996,
        "yearRangeText": "1993 - 1996",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-91-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-1-6l-lxi-exi",
        "modelName": "CIVIC (ตาโต) 1.6L LXi EXi",
        "engineId": "e-honda-civic-1-6l-lxi-exi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1996,
        "yearTo": 2000,
        "yearRangeText": "1996 - 2000",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-91-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-jazz-gd-1-5l-i-dsi",
        "modelName": "JAZZ (GD) 1.5L i-DSI",
        "engineId": "e-honda-jazz-gd-1-5l-i-dsi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2008,
        "yearRangeText": "2003 - 2008",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-91-6",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-jazz-gd-1-5l-vtec",
        "modelName": "JAZZ (GD) 1.5L VTEC",
        "engineId": "e-honda-jazz-gd-1-5l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-92",
    "sku": "P28 024N",
    "name": "Brembo Pad NAO P28 024N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022504G00",
      "GDB8008",
      "DB1262",
      "GDB1164"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 900,
    "supplierListPrice": 900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-92",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-92-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-brio-1-2l",
        "modelName": "BRIO 1.2L",
        "engineId": "e-honda-brio-1-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-92-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-1-5l-i-dsi",
        "modelName": "CITY 1.5L i-DSI",
        "engineId": "e-honda-city-1-5l-i-dsi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-92-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-1-5l-vtec",
        "modelName": "CITY 1.5L VTEC",
        "engineId": "e-honda-city-1-5l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-92-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-3-4-1-3l-1-5l-1-6l-lxi-exi",
        "modelName": "CIVIC (เตารีด) 3,4 ประตู 1.3L 1.5L 1.6L LXi Exi",
        "engineId": "e-honda-civic-3-4-1-3l-1-5l-1-6l-lxi-exi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1996,
        "yearRangeText": "1993 - 1996",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-92-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-1-6l-lxi-exi",
        "modelName": "CIVIC (ตาโต) 1.6L LXi EXi",
        "engineId": "e-honda-civic-1-6l-lxi-exi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1996,
        "yearTo": 2000,
        "yearRangeText": "1996 - 2000",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-92-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-jazz-gd-1-5l-i-dsi",
        "modelName": "JAZZ (GD) 1.5L i-DSI",
        "engineId": "e-honda-jazz-gd-1-5l-i-dsi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2008,
        "yearRangeText": "2003 - 2008",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-92-6",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-jazz-gd-1-5l-vtec",
        "modelName": "JAZZ (GD) 1.5L VTEC",
        "engineId": "e-honda-jazz-gd-1-5l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-93",
    "sku": "P28 034B",
    "name": "Brembo Pad Low-M P28 034B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022SDBA00",
      "GDB7634",
      "DB1393"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1150,
    "supplierListPrice": 1150,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-93",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-93-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-br-v-1-5l",
        "modelName": "BR-V 1.5L",
        "engineId": "e-honda-br-v-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearRangeText": "2016 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-93-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fd-2-0-vtec-fb-1-8-2-0-vtec",
        "modelName": "CIVIC FD (2.0 VTEC) / FB (1.8 2.0 VTEC)",
        "engineId": "e-honda-civic-fd-2-0-vtec-fb-1-8-2-0-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2015,
        "yearRangeText": "2006 - 2015",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-94",
    "sku": "P28 034N",
    "name": "Brembo Pad NAO P28 034N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022SDBA00",
      "GDB7634",
      "DB1393"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1180,
    "supplierListPrice": 1180,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-94",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-94-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-br-v-1-5l",
        "modelName": "BR-V 1.5L",
        "engineId": "e-honda-br-v-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearRangeText": "2016 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-94-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fd-2-0-vtec-fb-1-8-2-0-vtec",
        "modelName": "CIVIC FD (2.0 VTEC) / FB (1.8 2.0 VTEC)",
        "engineId": "e-honda-civic-fd-2-0-vtec-fb-1-8-2-0-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2015,
        "yearRangeText": "2006 - 2015",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-95",
    "sku": "P28 006N",
    "name": "Brembo Pad NAO P28 006N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022SB2673",
      "GDB358",
      "DB300"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1040,
    "supplierListPrice": 1040,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-95",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-95-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-1-3-1-5",
        "modelName": "CITY 1.3 1.5",
        "engineId": "e-honda-city-1-3-1-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1995,
        "yearTo": 1997,
        "yearRangeText": "1995 - 1997",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-95-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-3a2-type-z-1-3l-1-5l",
        "modelName": "CITY (3A2) Type Z 1.3L 1.5L",
        "engineId": "e-honda-city-3a2-type-z-1-3l-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2001,
        "yearRangeText": "1997 - 2001",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-95-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-1-3l-1-5l",
        "modelName": "CIVIC 1.3L 1.5L",
        "engineId": "e-honda-civic-1-3l-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1985,
        "yearTo": 1993,
        "yearRangeText": "1985 - 1993",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-95-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-3-4-1-3l-1-5l-1-6l-lx-ex",
        "modelName": "CIVIC (เตารีด) 3,4 ประตู 1.3L 1.5L 1.6L LX EX",
        "engineId": "e-honda-civic-3-4-1-3l-1-5l-1-6l-lx-ex",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1996,
        "yearRangeText": "1993 - 1996",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-96",
    "sku": "P28 008N",
    "name": "Brembo Pad NAO P28 008N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022SR3505",
      "GDB325"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 950,
    "supplierListPrice": 950,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-96",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-96-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-type-z",
        "modelName": "CITY Type Z",
        "engineId": "e-honda-city-type-z",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2001,
        "yearRangeText": "1997 - 2001",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-96-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-1-3l-1-5l",
        "modelName": "CIVIC 1.3L 1.5L",
        "engineId": "e-honda-civic-1-3l-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1985,
        "yearTo": 1993,
        "yearRangeText": "1985 - 1993",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-97",
    "sku": "P28 023N",
    "name": "Brembo Pad NAO P28 023N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022SR3V00",
      "GDB3375",
      "DB1286",
      "GDB3478"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1070,
    "supplierListPrice": 1070,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-97",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-97-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-1-5l-i-dsi",
        "modelName": "CITY 1.5L i-DSI",
        "engineId": "e-honda-city-1-5l-i-dsi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2013,
        "yearRangeText": "2008 - 2013",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-97-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-1-6l-vtec",
        "modelName": "CIVIC (ตาโต) 1.6L VTEC",
        "engineId": "e-honda-civic-1-6l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1996,
        "yearTo": 2000,
        "yearRangeText": "1996 - 2000",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-97-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-dimension-1-7l-exi",
        "modelName": "CIVIC (Dimension) 1.7L EXi",
        "engineId": "e-honda-civic-dimension-1-7l-exi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2005,
        "yearRangeText": "2000 - 2005",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-97-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-dimension-1-7l-2-0l-vtec",
        "modelName": "CIVIC (Dimension) 1.7L 2.0L VTEC",
        "engineId": "e-honda-civic-dimension-1-7l-2-0l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2005,
        "yearRangeText": "2000 - 2005",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-97-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fd-1-8l",
        "modelName": "CIVIC (FD) 1.8L",
        "engineId": "e-honda-civic-fd-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2012,
        "yearRangeText": "2006 - 2012",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-97-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fb-1-5l-hybrid",
        "modelName": "CIVIC (FB) 1.5L Hybrid",
        "engineId": "e-honda-civic-fb-1-5l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2015,
        "yearRangeText": "2012 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-97-6",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fb-s-e-1-8l",
        "modelName": "CIVIC (FB) S/E 1.8L",
        "engineId": "e-honda-civic-fb-s-e-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2015,
        "yearRangeText": "2012 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-97-7",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fd-fb-1-8-vtec",
        "modelName": "CIVIC FD/FB (1.8 VTEC)",
        "engineId": "e-honda-civic-fd-fb-1-8-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2015,
        "yearRangeText": "2006 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-97-8",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-freed-1-5l",
        "modelName": "FREED 1.5L",
        "engineId": "e-honda-freed-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2014,
        "yearRangeText": "2008 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-97-9",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-jazz-ge-1-5l-vtec",
        "modelName": "JAZZ (GE) 1.5L VTEC",
        "engineId": "e-honda-jazz-ge-1-5l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2013,
        "yearRangeText": "2008 - 2013",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-98",
    "sku": "P28 050X",
    "name": "Brembo Pad XTRA P28 050X",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022TM0T00",
      "GDB7786",
      "DB1991"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2250,
    "supplierListPrice": 2250,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-98",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-98-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gm-cng-1-5-vtec-15-18",
        "modelName": "CITY GM (CNG), 1.5 VTEC ปี15-18",
        "engineId": "e-honda-city-gm-cng-1-5-vtec-15-18",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2018,
        "yearRangeText": "2010 - 2018",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-98-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gm2-3-1-5l-cng",
        "modelName": "CITY (GM2/3) 1.5L CNG",
        "engineId": "e-honda-city-gm2-3-1-5l-cng",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2014,
        "yearRangeText": "2010 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-98-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gm4-5-6-7-8-9-1-5l",
        "modelName": "CITY (GM4/5/6/7/8/9) 1.5L",
        "engineId": "e-honda-city-gm4-5-6-7-8-9-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2019,
        "yearRangeText": "2014 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-98-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gn-1-0l-turbo",
        "modelName": "CITY (GN) 1.0L Turbo",
        "engineId": "e-honda-city-gn-1-0l-turbo",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-98-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-jazz-gk-1-5l-vtec",
        "modelName": "JAZZ (GK) 1.5L VTEC",
        "engineId": "e-honda-jazz-gk-1-5l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearRangeText": "2013 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-98-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-mobilio-1-5l",
        "modelName": "MOBILIO 1.5L",
        "engineId": "e-honda-mobilio-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-99",
    "sku": "P28 050B",
    "name": "Brembo Pad Low-M P28 050B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022TM0T00",
      "GDB7786",
      "DB1991"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1150,
    "supplierListPrice": 1150,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-99",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-99-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gm-cng-1-5-vtec-15-18",
        "modelName": "CITY GM (CNG), 1.5 VTEC ปี15-18",
        "engineId": "e-honda-city-gm-cng-1-5-vtec-15-18",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2018,
        "yearRangeText": "2010 - 2018",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-99-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gm2-3-1-5l-cng",
        "modelName": "CITY (GM2/3) 1.5L CNG",
        "engineId": "e-honda-city-gm2-3-1-5l-cng",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2014,
        "yearRangeText": "2010 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-99-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gm4-5-6-7-8-9-1-5l",
        "modelName": "CITY (GM4/5/6/7/8/9) 1.5L",
        "engineId": "e-honda-city-gm4-5-6-7-8-9-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2019,
        "yearRangeText": "2014 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-99-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gn-1-0l-turbo",
        "modelName": "CITY (GN) 1.0L Turbo",
        "engineId": "e-honda-city-gn-1-0l-turbo",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-99-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-jazz-gk-1-5l-vtec",
        "modelName": "JAZZ (GK) 1.5L VTEC",
        "engineId": "e-honda-jazz-gk-1-5l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearRangeText": "2013 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-99-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-mobilio-1-5l",
        "modelName": "MOBILIO 1.5L",
        "engineId": "e-honda-mobilio-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-100",
    "sku": "P28 050N",
    "name": "Brembo Pad NAO P28 050N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022TM0T00",
      "GDB7786",
      "DB1991"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1180,
    "supplierListPrice": 1180,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-100",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-100-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gm-cng-1-5-vtec-15-18",
        "modelName": "CITY GM (CNG), 1.5 VTEC ปี15-18",
        "engineId": "e-honda-city-gm-cng-1-5-vtec-15-18",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2018,
        "yearRangeText": "2010 - 2018",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-100-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gm2-3-1-5l-cng",
        "modelName": "CITY (GM2/3) 1.5L CNG",
        "engineId": "e-honda-city-gm2-3-1-5l-cng",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2014,
        "yearRangeText": "2010 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-100-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gm4-5-6-7-8-9-1-5l",
        "modelName": "CITY (GM4/5/6/7/8/9) 1.5L",
        "engineId": "e-honda-city-gm4-5-6-7-8-9-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2019,
        "yearRangeText": "2014 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-100-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gn-1-0l-turbo",
        "modelName": "CITY (GN) 1.0L Turbo",
        "engineId": "e-honda-city-gn-1-0l-turbo",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-100-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-jazz-gk-1-5l-vtec",
        "modelName": "JAZZ (GK) 1.5L VTEC",
        "engineId": "e-honda-jazz-gk-1-5l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearRangeText": "2013 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-100-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-mobilio-1-5l",
        "modelName": "MOBILIO 1.5L",
        "engineId": "e-honda-mobilio-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-101",
    "sku": "P28 017N",
    "name": "Brembo Pad NAO P28 017N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022S04E02",
      "GDB499",
      "DB1163"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 830,
    "supplierListPrice": 830,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-101",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-101-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-city-gm2-3-1-5l-cng",
        "modelName": "CITY (GM2/3) 1.5L CNG",
        "engineId": "e-honda-city-gm2-3-1-5l-cng",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2014,
        "yearRangeText": "2010 - 2014",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-101-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-3-4-1-3l-1-5l-1-6l-lx-ex",
        "modelName": "CIVIC (เตารีด) 3,4 ประตู 1.3L 1.5L 1.6L LX EX",
        "engineId": "e-honda-civic-3-4-1-3l-1-5l-1-6l-lx-ex",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1996,
        "yearRangeText": "1993 - 1996",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-101-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-3-4-1-3l-1-5l-1-6l-lxi-exi",
        "modelName": "CIVIC (เตารีด) 3,4 ประตู 1.3L 1.5L 1.6L LXi Exi",
        "engineId": "e-honda-civic-3-4-1-3l-1-5l-1-6l-lxi-exi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1996,
        "yearRangeText": "1993 - 1996",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-101-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-jazz-gd-1-5l-vtec",
        "modelName": "JAZZ (GD) 1.5L VTEC",
        "engineId": "e-honda-jazz-gd-1-5l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-101-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-jazz-gk-1-5l-vtec",
        "modelName": "JAZZ (GK) 1.5L VTEC",
        "engineId": "e-honda-jazz-gk-1-5l-vtec",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearRangeText": "2013 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-102",
    "sku": "P28 035B",
    "name": "Brembo Pad Low-M P28 035B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022S9AA00",
      "GDB3325",
      "DB1481"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 950,
    "supplierListPrice": 950,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-102",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-102-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fc-fk-1-5t-1-8l",
        "modelName": "CIVIC (FC, FK) 1.5T 1.8L",
        "engineId": "e-honda-civic-fc-fk-1-5t-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearTo": 2021,
        "yearRangeText": "2016 - 2021",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-102-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fe-1-5t",
        "modelName": "CIVIC (FE) 1.5T",
        "engineId": "e-honda-civic-fe-1-5t",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2021,
        "yearRangeText": "2021 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-102-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen2-2-0l-2-4l-2wd",
        "modelName": "CR-V (Gen2) 2.0L 2.4L 2WD",
        "engineId": "e-honda-cr-v-gen2-2-0l-2-4l-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-102-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-stepwgn-spada-rk-2-0l",
        "modelName": "STEPWGN SPADA (RK) 2.0L",
        "engineId": "e-honda-stepwgn-spada-rk-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2014,
        "yearRangeText": "2009 - 2014",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-103",
    "sku": "P28 035N",
    "name": "Brembo Pad NAO P28 035N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022S9AA00",
      "GDB3325",
      "DB1481"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1030,
    "supplierListPrice": 1030,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-103",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-103-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fc-fk-1-5t-1-8l",
        "modelName": "CIVIC (FC, FK) 1.5T 1.8L",
        "engineId": "e-honda-civic-fc-fk-1-5t-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearTo": 2021,
        "yearRangeText": "2016 - 2021",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-103-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-fe-1-5t",
        "modelName": "CIVIC (FE) 1.5T",
        "engineId": "e-honda-civic-fe-1-5t",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2021,
        "yearRangeText": "2021 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-103-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen2-2-0l-2-4l-2wd",
        "modelName": "CR-V (Gen2) 2.0L 2.4L 2WD",
        "engineId": "e-honda-cr-v-gen2-2-0l-2-4l-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-103-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-stepwgn-spada-rk-2-0l",
        "modelName": "STEPWGN SPADA (RK) 2.0L",
        "engineId": "e-honda-stepwgn-spada-rk-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2014,
        "yearRangeText": "2009 - 2014",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-104",
    "sku": "P28 032B",
    "name": "Brembo Pad Low-M P28 032B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022S0A940",
      "GDB3250",
      "DB1452"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1450,
    "supplierListPrice": 1450,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-104",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-104-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-ep3-type-r-fn2-type-r",
        "modelName": "CIVIC EP3 (Type-R) / FN2 (Type-R)",
        "engineId": "e-honda-civic-ep3-type-r-fn2-type-r",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearRangeText": "2001 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-104-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-s2000-ap-2-0-2-2",
        "modelName": "S2000 (AP) 2.0 2.2",
        "engineId": "e-honda-s2000-ap-2-0-2-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1999,
        "yearTo": 2003,
        "yearRangeText": "1999 - 2003",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-105",
    "sku": "P28 032N",
    "name": "Brembo Pad NAO P28 032N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022S0A940",
      "GDB3250",
      "DB1452"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1600,
    "supplierListPrice": 1600,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-105",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-105-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-ep3-type-r-fn2-type-r",
        "modelName": "CIVIC EP3 (Type-R) / FN2 (Type-R)",
        "engineId": "e-honda-civic-ep3-type-r-fn2-type-r",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearRangeText": "2001 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-105-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-s2000-ap-2-0-2-2",
        "modelName": "S2000 (AP) 2.0 2.2",
        "engineId": "e-honda-s2000-ap-2-0-2-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1999,
        "yearTo": 2003,
        "yearRangeText": "1999 - 2003",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-106",
    "sku": "P28 038N",
    "name": "Brembo Pad NAO P28 038N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022SMGE03"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1800,
    "supplierListPrice": 1800,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-106",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-106-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-civic-type-r-fn2-06",
        "modelName": "CIVIC Type-R FN2 (ปี06)",
        "engineId": "e-honda-civic-type-r-fn2-06",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearRangeText": "2006 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-107",
    "sku": "P28 068N",
    "name": "Brembo Pad NAO P28 068N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022T0AA01",
      "GDB7738",
      "DB1843",
      "GDB3581"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1250,
    "supplierListPrice": 1250,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-107",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-107-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen3-2-0l-2-4l-2wd-awd",
        "modelName": "CR-V (Gen3) 2.0L 2.4L 2WD/AWD",
        "engineId": "e-honda-cr-v-gen3-2-0l-2-4l-2wd-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2012,
        "yearRangeText": "2008 - 2012",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-107-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen4-2-0l-2-4l-2wd-awd",
        "modelName": "CR-V (Gen4) 2.0L 2.4L 2WD/AWD",
        "engineId": "e-honda-cr-v-gen4-2-0l-2-4l-2wd-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2016,
        "yearRangeText": "2012 - 2016",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-107-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen5-1-6d-2-4l-2wd-4wd",
        "modelName": "CR-V (Gen5) 1.6D 2.4L 2WD/4WD",
        "engineId": "e-honda-cr-v-gen5-1-6d-2-4l-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-108",
    "sku": "P28 097N",
    "name": "Brembo Pad NAO P28 097N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022TLAA00",
      "GDB8991",
      "DB2450"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1460,
    "supplierListPrice": 1460,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-108",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-108-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen5-1-6d-2-4l-2wd-4wd",
        "modelName": "CR-V (Gen5) 1.6D 2.4L 2WD/4WD",
        "engineId": "e-honda-cr-v-gen5-1-6d-2-4l-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-108-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen5-1-5-vtec-17-2-0-hybrid-20",
        "modelName": "CR-V (Gen5) 1.5 VTEC ปี17, 2.0 Hybrid ปี20",
        "engineId": "e-honda-cr-v-gen5-1-5-vtec-17-2-0-hybrid-20",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-109",
    "sku": "P28 098N",
    "name": "Brembo Pad NAO P28 098N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "45022TMCT01 / 45022TLAA01 / 45022TRNH00",
      "GDB2244"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2200,
    "supplierListPrice": 2200,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-109",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-109-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen5-1-5-vtec-17-2-0-hybrid-20",
        "modelName": "CR-V (Gen5) 1.5 VTEC ปี17, 2.0 Hybrid ปี20",
        "engineId": "e-honda-cr-v-gen5-1-5-vtec-17-2-0-hybrid-20",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-110",
    "sku": "P28 046B",
    "name": "Brembo Pad Low-M P28 046B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022SWWG01",
      "GDB3446",
      "DB2256"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1150,
    "supplierListPrice": 1150,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-110",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-110-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen5-1-6d-2-4-2wd-4wd",
        "modelName": "CR-V (Gen5) 1.6D 2.4 2WD/4WD",
        "engineId": "e-honda-cr-v-gen5-1-6d-2-4-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-111",
    "sku": "P28 046N",
    "name": "Brembo Pad NAO P28 046N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022SWWG01",
      "GDB3446",
      "DB2256"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1250,
    "supplierListPrice": 1250,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-111",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-111-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-cr-v-gen5-1-6d-2-4-2wd-4wd",
        "modelName": "CR-V (Gen5) 1.6D 2.4 2WD/4WD",
        "engineId": "e-honda-cr-v-gen5-1-6d-2-4-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-112",
    "sku": "P28 090B",
    "name": "Brembo Pad Low-M P28 090B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022T7JH01",
      "GDB7915",
      "DB2355"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 750,
    "supplierListPrice": 750,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-112",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-112-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-hr-v-1-8l",
        "modelName": "HR-V 1.8L",
        "engineId": "e-honda-hr-v-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2021,
        "yearRangeText": "2014 - 2021",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-113",
    "sku": "P28 090N",
    "name": "Brembo Pad NAO P28 090N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022T7JH01",
      "GDB7915",
      "DB2355"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 830,
    "supplierListPrice": 830,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-113",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-113-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-hr-v-1-8l",
        "modelName": "HR-V 1.8L",
        "engineId": "e-honda-hr-v-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2021,
        "yearRangeText": "2014 - 2021",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-114",
    "sku": "P56 047N",
    "name": "Brembo Pad NAO P56 047N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "41060CD028",
      "GDB3381",
      "DB1520"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2300,
    "supplierListPrice": 2300,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-114",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-114-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-integra-dc5-2-0-type-r",
        "modelName": "INTEGRA DC5 2.0 Type-R",
        "engineId": "e-honda-integra-dc5-2-0-type-r",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearRangeText": "2001 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-114-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-350z-z33-3-5-brembo-4-pot-caliper",
        "modelName": "350Z Z33 3.5 (Brembo 4 Pot Caliper)",
        "engineId": "e-nissan-350z-z33-3-5-brembo-4-pot-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearRangeText": "2002 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-115",
    "sku": "P28 040N",
    "name": "Brembo Pad NAO P28 040N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022SL0000",
      "GDB3039"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1900,
    "supplierListPrice": 1900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-115",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-115-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-nsx-3-0",
        "modelName": "NSX 3.0",
        "engineId": "e-honda-nsx-3-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearRangeText": "1993 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-116",
    "sku": "P28 062N",
    "name": "Brembo Pad NAO P28 062N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "43022SHJ415"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1500,
    "supplierListPrice": 1500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-116",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-116-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-honda",
        "brandName": "Honda",
        "modelId": "m-honda-odyssey-2-4-rb3-4-08",
        "modelName": "ODYSSEY 2.4 RB3-4 (ปี08)",
        "engineId": "e-honda-odyssey-2-4-rb3-4-08",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2008,
        "yearRangeText": "2008",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-117",
    "sku": "P30 073N",
    "name": "Brembo Pad NAO P30 073N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "581012VA00",
      "GDB7843",
      "DB2240"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1750,
    "supplierListPrice": 1750,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-117",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-117-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-elantra-md-ud-1-6",
        "modelName": "ELANTRA MD UD 1.6",
        "engineId": "e-hyundai-elantra-md-ud-1-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearRangeText": "2011 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-117-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-veloster",
        "modelName": "VELOSTER",
        "engineId": "e-hyundai-veloster",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-118",
    "sku": "P30 067N",
    "name": "Brembo Pad NAO P30 067N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "583021RA30",
      "GDB3494",
      "DB2076"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1420,
    "supplierListPrice": 1420,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-118",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-118-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-elantra-md-ud-1-6",
        "modelName": "ELANTRA MD UD 1.6",
        "engineId": "e-hyundai-elantra-md-ud-1-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearRangeText": "2011 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-118-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-veloster-fs-1-6-i30-gd",
        "modelName": "VELOSTER FS 1.6 / i30 GD",
        "engineId": "e-hyundai-veloster-fs-1-6-i30-gd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearRangeText": "2011 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-119",
    "sku": "P30 041B",
    "name": "Brembo Pad Low-M P30 041B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "581014DE00",
      "GDB3448",
      "DB1940"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1450,
    "supplierListPrice": 1450,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-119",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-119-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-h-1-grand-starex-tq-2-5l",
        "modelName": "H-1 / GRAND STAREX (TQ) 2.5L",
        "engineId": "e-hyundai-h-1-grand-starex-tq-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearRangeText": "2008 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-119-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-staria",
        "modelName": "STARIA",
        "engineId": "e-hyundai-staria",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearTo": 2019,
        "yearRangeText": "2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-119-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-kia",
        "brandName": "Kia",
        "modelId": "m-kia-grand-carnival-2-2-2-7-2-9-vq",
        "modelName": "GRAND CARNIVAL 2.2 2.7 2.9 VQ",
        "engineId": "e-kia-grand-carnival-2-2-2-7-2-9-vq",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2015,
        "yearRangeText": "2006 - 2015",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-120",
    "sku": "P30 041N",
    "name": "Brembo Pad NAO P30 041N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "581014DE00",
      "GDB3448",
      "DB1940"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1520,
    "supplierListPrice": 1520,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-120",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-120-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-h-1-grand-starex-tq-2-5l",
        "modelName": "H-1 / GRAND STAREX (TQ) 2.5L",
        "engineId": "e-hyundai-h-1-grand-starex-tq-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearRangeText": "2008 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-120-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-staria",
        "modelName": "STARIA",
        "engineId": "e-hyundai-staria",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearTo": 2019,
        "yearRangeText": "2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-120-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-kia",
        "brandName": "Kia",
        "modelId": "m-kia-grand-carnival-2-2-2-7-2-9-vq",
        "modelName": "GRAND CARNIVAL 2.2 2.7 2.9 VQ",
        "engineId": "e-kia-grand-carnival-2-2-2-7-2-9-vq",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2015,
        "yearRangeText": "2006 - 2015",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-121",
    "sku": "P30 035B",
    "name": "Brembo Pad Low-M P30 035B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "583023JA50",
      "GDB3449",
      "DB1957"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 980,
    "supplierListPrice": 980,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-121",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-121-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-h-1-grand-starex-tq-2-5l",
        "modelName": "H-1 / GRAND STAREX (TQ) 2.5L",
        "engineId": "e-hyundai-h-1-grand-starex-tq-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearRangeText": "2008 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-121-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-staria",
        "modelName": "STARIA",
        "engineId": "e-hyundai-staria",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearTo": 2019,
        "yearRangeText": "2019",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-121-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-kia",
        "brandName": "Kia",
        "modelId": "m-kia-grand-carnival-2-2-2-7-2-9-vq",
        "modelName": "GRAND CARNIVAL 2.2 2.7 2.9 VQ",
        "engineId": "e-kia-grand-carnival-2-2-2-7-2-9-vq",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2015,
        "yearRangeText": "2006 - 2015",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-121-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-kia",
        "brandName": "Kia",
        "modelId": "m-kia-grand-carnival-2-2-yp",
        "modelName": "GRAND CARNIVAL 2.2 YP",
        "engineId": "e-kia-grand-carnival-2-2-yp",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2020,
        "yearRangeText": "2015 - 2020",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-122",
    "sku": "P30 035N",
    "name": "Brembo Pad NAO P30 035N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "583023JA50",
      "GDB3449",
      "DB1957"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1020,
    "supplierListPrice": 1020,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-122",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-122-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-h-1-grand-starex-tq-2-5l",
        "modelName": "H-1 / GRAND STAREX (TQ) 2.5L",
        "engineId": "e-hyundai-h-1-grand-starex-tq-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearRangeText": "2008 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-122-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-staria",
        "modelName": "STARIA",
        "engineId": "e-hyundai-staria",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearTo": 2019,
        "yearRangeText": "2019",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-122-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-kia",
        "brandName": "Kia",
        "modelId": "m-kia-grand-carnival-2-2-2-7-2-9-vq",
        "modelName": "GRAND CARNIVAL 2.2 2.7 2.9 VQ",
        "engineId": "e-kia-grand-carnival-2-2-2-7-2-9-vq",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2015,
        "yearRangeText": "2006 - 2015",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-122-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-kia",
        "brandName": "Kia",
        "modelId": "m-kia-grand-carnival-2-2-yp",
        "modelName": "GRAND CARNIVAL 2.2 YP",
        "engineId": "e-kia-grand-carnival-2-2-yp",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2020,
        "yearRangeText": "2015 - 2020",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-123",
    "sku": "P30 018N",
    "name": "Brembo Pad NAO P30 018N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "581012CA10",
      "GDB3352",
      "DB1504"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1400,
    "supplierListPrice": 1400,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-123",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-123-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-sonata",
        "modelName": "SONATA",
        "engineId": "e-hyundai-sonata",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearRangeText": "2007 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-123-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-santafe",
        "modelName": "SANTAFE",
        "engineId": "e-hyundai-santafe",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearRangeText": "2008 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-123-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-tiburon-coupe",
        "modelName": "TIBURON COUPE",
        "engineId": "e-hyundai-tiburon-coupe",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearRangeText": "2006 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-124",
    "sku": "P30 014N",
    "name": "Brembo Pad NAO P30 014N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "5830226A00",
      "GDB3298"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 790,
    "supplierListPrice": 790,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-124",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-124-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-sonata",
        "modelName": "SONATA",
        "engineId": "e-hyundai-sonata",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearRangeText": "2007 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-124-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-santafe",
        "modelName": "SANTAFE",
        "engineId": "e-hyundai-santafe",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearRangeText": "2008 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-124-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-tiburon-coupe",
        "modelName": "TIBURON COUPE",
        "engineId": "e-hyundai-tiburon-coupe",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearRangeText": "2006 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-125",
    "sku": "P30 055N",
    "name": "Brembo Pad NAO P30 055N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "581012SA30"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1230,
    "supplierListPrice": 1230,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-125",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-125-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-tucson-4x2",
        "modelName": "TUCSON 4x2",
        "engineId": "e-hyundai-tucson-4x2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2010,
        "yearRangeText": "2010",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-126",
    "sku": "P30 039N",
    "name": "Brembo Pad NAO P30 039N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "581013ZA00"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1520,
    "supplierListPrice": 1520,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-126",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-126-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-tucson-4x4",
        "modelName": "TUCSON 4x4",
        "engineId": "e-hyundai-tucson-4x4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2010,
        "yearRangeText": "2010",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-127",
    "sku": "P30 051N",
    "name": "Brembo Pad NAO P30 051N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "583022YA50"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 990,
    "supplierListPrice": 990,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-127",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-127-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-tucson-4x2-4x4",
        "modelName": "TUCSON 4x2 4x4",
        "engineId": "e-hyundai-tucson-4x2-4x4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2010,
        "yearRangeText": "2010",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-128",
    "sku": "P30 065N",
    "name": "Brembo Pad NAO P30 065N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "581012VA70"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1500,
    "supplierListPrice": 1500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-128",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-128-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-hyundai",
        "brandName": "Hyundai",
        "modelId": "m-hyundai-veloster-1-6-turbo",
        "modelName": "VELOSTER 1.6 TURBO",
        "engineId": "e-hyundai-veloster-1-6-turbo",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-129",
    "sku": "P37 004N",
    "name": "Brembo Pad NAO P37 004N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0K5533323ZA",
      "GDB1153"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-129",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-129-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-kia",
        "brandName": "Kia",
        "modelId": "m-kia-carnival-2-5-2-9-99-v6",
        "modelName": "CARNIVAL 2.5/2.9 (ปี99) V6",
        "engineId": "e-kia-carnival-2-5-2-9-99-v6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1999,
        "yearTo": 2001,
        "yearRangeText": "1999 - 2001",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-130",
    "sku": "P30 012N",
    "name": "Brembo Pad NAO P30 012N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0K75A3328Z",
      "GDB3261",
      "DB1489"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1420,
    "supplierListPrice": 1420,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-130",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-130-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-kia",
        "brandName": "Kia",
        "modelId": "m-kia-carnival-2-0-2-4-pregio",
        "modelName": "CARNIVAL 2.0 2.4 / PREGIO",
        "engineId": "e-kia-carnival-2-0-2-4-pregio",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2006,
        "yearRangeText": "2000 - 2006",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-131",
    "sku": "P30 095N",
    "name": "Brembo Pad NAO P30 095N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "58101A9A00"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1560,
    "supplierListPrice": 1560,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-131",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-131-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-kia",
        "brandName": "Kia",
        "modelId": "m-kia-carnival-2-2-crdi",
        "modelName": "CARNIVAL 2.2 CRDI",
        "engineId": "e-kia-carnival-2-2-crdi",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2015,
        "yearRangeText": "2010 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-131-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-kia",
        "brandName": "Kia",
        "modelId": "m-kia-grand-carnival-2-2-yp",
        "modelName": "GRAND CARNIVAL 2.2 YP",
        "engineId": "e-kia-grand-carnival-2-2-yp",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2020,
        "yearRangeText": "2015 - 2020",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-132",
    "sku": "P30 013N",
    "name": "Brembo Pad NAO P30 013N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "48130091A0"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1370,
    "supplierListPrice": 1370,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-132",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-132-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ssangyong",
        "brandName": "Ssangyong",
        "modelId": "m-ssangyong-rexton-actyon",
        "modelName": "Rexton / Actyon",
        "engineId": "e-ssangyong-rexton-actyon",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2014,
        "yearRangeText": "2006 - 2014",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-133",
    "sku": "P30 028N",
    "name": "Brembo Pad NAO P30 028N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4813A21100",
      "GDB3412",
      "DB1684"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1750,
    "supplierListPrice": 1750,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-133",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-133-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ssangyong",
        "brandName": "Ssangyong",
        "modelId": "m-ssangyong-stavic-2-0-2-7-3-2",
        "modelName": "STAVIC 2.0 2.7 3.2",
        "engineId": "e-ssangyong-stavic-2-0-2-7-3-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearRangeText": "2005 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-134",
    "sku": "P30 057N",
    "name": "Brembo Pad NAO P30 057N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "48413091A0",
      "GDB3413",
      "DB1673"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1370,
    "supplierListPrice": 1370,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-134",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-134-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-ssangyong",
        "brandName": "Ssangyong",
        "modelId": "m-ssangyong-stavic-2-0-2-7-3-2",
        "modelName": "STAVIC 2.0 2.7 3.2",
        "engineId": "e-ssangyong-stavic-2-0-2-7-3-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearRangeText": "2005 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-134-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-extender-2-0d-turbo-grand",
        "modelName": "Extender 2.0D Turbo Grand",
        "engineId": "e-mg-extender-2-0d-turbo-grand",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-135",
    "sku": "P44 020B",
    "name": "Brembo Pad Low-M P44 020B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "10138340",
      "GDB7992",
      "DB1998"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2400,
    "supplierListPrice": 2400,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-135",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-135-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-ep",
        "modelName": "EP",
        "engineId": "e-mg-ep",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-135-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-gs-1-5-2-0",
        "modelName": "GS 1.5 2.0",
        "engineId": "e-mg-gs-1-5-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-135-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-hs-1-5-turbo",
        "modelName": "HS 1.5 Turbo",
        "engineId": "e-mg-hs-1-5-turbo",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-136",
    "sku": "P44 020N",
    "name": "Brembo Pad NAO P44 020N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "10138340",
      "GDB7992",
      "DB1998"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2600,
    "supplierListPrice": 2600,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-136",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-136-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-ep",
        "modelName": "EP",
        "engineId": "e-mg-ep",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-136-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-gs-1-5-2-0",
        "modelName": "GS 1.5 2.0",
        "engineId": "e-mg-gs-1-5-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-136-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-hs-1-5-turbo",
        "modelName": "HS 1.5 Turbo",
        "engineId": "e-mg-hs-1-5-turbo",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-137",
    "sku": "P51 001N",
    "name": "Brembo Pad NAO P51 001N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "10332331 / 10172328",
      "GDB7993"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2150,
    "supplierListPrice": 2150,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-137",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-137-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-gs-1-5-2-0",
        "modelName": "GS 1.5 2.0",
        "engineId": "e-mg-gs-1-5-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-137-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-hs-1-5-turbo",
        "modelName": "HS 1.5 Turbo",
        "engineId": "e-mg-hs-1-5-turbo",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-138",
    "sku": "P24 076N",
    "name": "Brembo Pad NAO P24 076N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "30778910",
      "GDB1683"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2200,
    "supplierListPrice": 2200,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-138",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-138-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-hs-1-5-turbo",
        "modelName": "HS 1.5 Turbo",
        "engineId": "e-mg-hs-1-5-turbo",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-139",
    "sku": "P85 020N",
    "name": "Brembo Pad NAO P85 020N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4B0698451B",
      "GDB1330",
      "DB1192"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 850,
    "supplierListPrice": 850,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-139",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-139-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-zs-1-5",
        "modelName": "ZS 1.5",
        "engineId": "e-mg-zs-1-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearTo": 2020,
        "yearRangeText": "2018 - 2020"
      },
      {
        "id": "vf-brembo-139-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-zs-1-0-1-5-mg-5-hatchback-1-5",
        "modelName": "ZS 1.0 1.5 / MG 5 Hatchback 1.5",
        "engineId": "e-mg-zs-1-0-1-5-mg-5-hatchback-1-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -"
      }
    ]
  },
  {
    "id": "pm-brembo-140",
    "sku": "P85 017N",
    "name": "Brembo Pad NAO P85 017N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "8E0698451B",
      "GDB823",
      "DB1192"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1180,
    "supplierListPrice": 1180,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-140",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-140-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-zs-1-5",
        "modelName": "ZS 1.5",
        "engineId": "e-mg-zs-1-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearTo": 2020,
        "yearRangeText": "2018 - 2020",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-141",
    "sku": "P51 003N",
    "name": "Brembo Pad NAO P51 003N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "10088104 / 10197211",
      "GDB8009"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2180,
    "supplierListPrice": 2180,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-141",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-141-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-zs-1-0-1-5-mg-5-hatchback-1-5",
        "modelName": "ZS 1.0 1.5 / MG 5 Hatchback 1.5",
        "engineId": "e-mg-zs-1-0-1-5-mg-5-hatchback-1-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-142",
    "sku": "P36 022B",
    "name": "Brembo Pad Low-M P36 022B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "C2C039929",
      "GDB1705"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2700,
    "supplierListPrice": 2700,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-142",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-142-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-zs-ev-mg5-21",
        "modelName": "ZS EV / MG5 (ปี21)",
        "engineId": "e-mg-zs-ev-mg5-21",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2021,
        "yearRangeText": "2021 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-143",
    "sku": "P36 022N",
    "name": "Brembo Pad NAO P36 022N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "C2C039929",
      "GDB1705"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2900,
    "supplierListPrice": 2900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-143",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-143-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mg",
        "brandName": "Mg",
        "modelId": "m-mg-zs-ev-mg5-21",
        "modelName": "ZS EV / MG5 (ปี21)",
        "engineId": "e-mg-zs-ev-mg5-21",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2021,
        "yearRangeText": "2021 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-144",
    "sku": "P16 011N",
    "name": "Brembo Pad NAO P16 011N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4605B005",
      "GDB3358",
      "DB1912"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 710,
    "supplierListPrice": 710,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-144",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-144-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-mirage-eco-1-2-attrage",
        "modelName": "MIRAGE ECO 1.2 / ATTRAGE",
        "engineId": "e-mitsubishi-mirage-eco-1-2-attrage",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-145",
    "sku": "P54 015B",
    "name": "Brembo Pad Low-M P54 015B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MB699174",
      "GDB3046",
      "DB1201"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1250,
    "supplierListPrice": 1250,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-145",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-145-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-e-car-ck2-1-5-1-6",
        "modelName": "LANCER E-Car / CK2 1.5 1.6",
        "engineId": "e-mitsubishi-lancer-e-car-ck2-1-5-1-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1996,
        "yearRangeText": "1993 - 1996",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-146",
    "sku": "P54 016B",
    "name": "Brembo Pad Low-M P54 016B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MB928314",
      "GDB3045",
      "DB1278"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1150,
    "supplierListPrice": 1150,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-146",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-146-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-e-car-ck2-1-5-1-6",
        "modelName": "LANCER E-Car / CK2 1.5 1.6",
        "engineId": "e-mitsubishi-lancer-e-car-ck2-1-5-1-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1996,
        "yearRangeText": "1993 - 1996",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-147",
    "sku": "P54 041B",
    "name": "Brembo Pad Low-M P54 041B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MR569225",
      "GDB7651",
      "DB1455"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1000,
    "supplierListPrice": 1000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-147",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-147-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-cedia-1-6-1-8",
        "modelName": "LANCER CEDIA 1.6 1.8",
        "engineId": "e-mitsubishi-lancer-cedia-1-6-1-8",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearTo": 2007,
        "yearRangeText": "2001 - 2007",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-148",
    "sku": "P54 041N",
    "name": "Brembo Pad NAO P54 041N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MR569225",
      "GDB7651",
      "DB1455"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1040,
    "supplierListPrice": 1040,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-148",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-148-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-cedia-1-6-1-8",
        "modelName": "LANCER CEDIA 1.6 1.8",
        "engineId": "e-mitsubishi-lancer-cedia-1-6-1-8",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearTo": 2007,
        "yearRangeText": "2001 - 2007",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-149",
    "sku": "P54 034B",
    "name": "Brembo Pad Low-M P54 034B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MN116929",
      "GDB3341",
      "DB1686"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 950,
    "supplierListPrice": 950,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-149",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-149-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-cedia-1-6-1-8",
        "modelName": "LANCER CEDIA 1.6 1.8",
        "engineId": "e-mitsubishi-lancer-cedia-1-6-1-8",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearTo": 2007,
        "yearRangeText": "2001 - 2007",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-149-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-cedia-1-6-1-8-2-0",
        "modelName": "LANCER CEDIA 1.6 1.8 2.0",
        "engineId": "e-mitsubishi-lancer-cedia-1-6-1-8-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-150",
    "sku": "P54 034N",
    "name": "Brembo Pad NAO P54 034N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MN116929",
      "GDB3341",
      "DB1686"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 990,
    "supplierListPrice": 990,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-150",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-150-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-cedia-1-6-1-8",
        "modelName": "LANCER CEDIA 1.6 1.8",
        "engineId": "e-mitsubishi-lancer-cedia-1-6-1-8",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearTo": 2007,
        "yearRangeText": "2001 - 2007",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-150-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-cedia-1-6-1-8-2-0",
        "modelName": "LANCER CEDIA 1.6 1.8 2.0",
        "engineId": "e-mitsubishi-lancer-cedia-1-6-1-8-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-151",
    "sku": "P54 030B",
    "name": "Brembo Pad Low-M P54 030B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MR527675",
      "GDB3287",
      "DB1441"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 850,
    "supplierListPrice": 850,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-151",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-151-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-cedia-1-6-1-8-2-0",
        "modelName": "LANCER CEDIA 1.6 1.8 2.0",
        "engineId": "e-mitsubishi-lancer-cedia-1-6-1-8-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-151-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-ex-1-8-2-0",
        "modelName": "LANCER EX 1.8 2.0",
        "engineId": "e-mitsubishi-lancer-ex-1-8-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2015,
        "yearRangeText": "2009 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-151-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-space-wagon-2-4-04",
        "modelName": "SPACE WAGON 2.4 (ปี04->)",
        "engineId": "e-mitsubishi-space-wagon-2-4-04",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearRangeText": "2004 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-152",
    "sku": "P54 030N",
    "name": "Brembo Pad NAO P54 030N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MR527675",
      "GDB3287",
      "DB1441"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 900,
    "supplierListPrice": 900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-152",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-152-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-cedia-1-6-1-8-2-0",
        "modelName": "LANCER CEDIA 1.6 1.8 2.0",
        "engineId": "e-mitsubishi-lancer-cedia-1-6-1-8-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-152-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-ex-1-8-2-0",
        "modelName": "LANCER EX 1.8 2.0",
        "engineId": "e-mitsubishi-lancer-ex-1-8-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2015,
        "yearRangeText": "2009 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-152-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-space-wagon-2-4-04",
        "modelName": "SPACE WAGON 2.4 (ปี04->)",
        "engineId": "e-mitsubishi-space-wagon-2-4-04",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearRangeText": "2004 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-153",
    "sku": "P54 031B",
    "name": "Brembo Pad Low-M P54 031B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MN102628",
      "GDB3247",
      "DB1464"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1400,
    "supplierListPrice": 1400,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-153",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-153-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-ex-1-8-2-0",
        "modelName": "LANCER EX 1.8 2.0",
        "engineId": "e-mitsubishi-lancer-ex-1-8-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2015,
        "yearRangeText": "2009 - 2015",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-153-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-space-wagon-2-4-04",
        "modelName": "SPACE WAGON 2.4 (ปี04->)",
        "engineId": "e-mitsubishi-space-wagon-2-4-04",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearRangeText": "2004 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-154",
    "sku": "P54 031N",
    "name": "Brembo Pad NAO P54 031N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MN102628",
      "GDB3247",
      "DB1464"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1460,
    "supplierListPrice": 1460,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-154",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-154-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-ex-1-8-2-0",
        "modelName": "LANCER EX 1.8 2.0",
        "engineId": "e-mitsubishi-lancer-ex-1-8-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2015,
        "yearRangeText": "2009 - 2015",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-154-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-space-wagon-2-4-04",
        "modelName": "SPACE WAGON 2.4 (ปี04->)",
        "engineId": "e-mitsubishi-space-wagon-2-4-04",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearRangeText": "2004 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-155",
    "sku": "P54 025B",
    "name": "Brembo Pad Low-M P54 025B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MB857610",
      "GDB3044",
      "DB1238"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1500,
    "supplierListPrice": 1500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-155",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-155-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-evolution-2-3-4-5-6",
        "modelName": "Lancer EVOLUTION 2 3 4 5 6",
        "engineId": "e-mitsubishi-lancer-evolution-2-3-4-5-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1991,
        "yearTo": 1991,
        "yearRangeText": "1991",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-156",
    "sku": "P54 025N",
    "name": "Brembo Pad NAO P54 025N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MB857610",
      "GDB3044",
      "DB1238"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1700,
    "supplierListPrice": 1700,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-156",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-156-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-evolution-2-3-4-5-6",
        "modelName": "Lancer EVOLUTION 2 3 4 5 6",
        "engineId": "e-mitsubishi-lancer-evolution-2-3-4-5-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1991,
        "yearTo": 1991,
        "yearRangeText": "1991",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-157",
    "sku": "P54 040B",
    "name": "Brembo Pad Low-M P54 040B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "GDB3349",
      "DB1478"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2600,
    "supplierListPrice": 2600,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-157",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-157-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-evolution-5-6-7-brembo-4-pot-caliper",
        "modelName": "Lancer EVOLUTION 5 6 7 (Brembo 4 Pot Caliper)",
        "engineId": "e-mitsubishi-lancer-evolution-5-6-7-brembo-4-pot-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-158",
    "sku": "P54 040N",
    "name": "Brembo Pad NAO P54 040N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "GDB3349",
      "DB1478"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 3000,
    "supplierListPrice": 3000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-158",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-158-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-evolution-5-6-7-brembo-4-pot-caliper",
        "modelName": "Lancer EVOLUTION 5 6 7 (Brembo 4 Pot Caliper)",
        "engineId": "e-mitsubishi-lancer-evolution-5-6-7-brembo-4-pot-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-159",
    "sku": "P54 039B",
    "name": "Brembo Pad Low-M P54 039B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26296FE040",
      "GDB3349",
      "DB1678"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2300,
    "supplierListPrice": 2300,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-159",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-159-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-evolution-7-8-9-front-4-pot-rear-2-pot-brembo-caliper",
        "modelName": "Lancer EVOLUTION 7 8 9 (Front 4 Pot/Rear 2 Pot Brembo Caliper)",
        "engineId": "e-mitsubishi-lancer-evolution-7-8-9-front-4-pot-rear-2-pot-brembo-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-159-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-evolution-x-cz4a",
        "modelName": "Lancer EVOLUTION X (CZ4A)",
        "engineId": "e-mitsubishi-lancer-evolution-x-cz4a",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2015,
        "yearRangeText": "2008 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-159-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-impreza-gg-sti-gga-gd-gdb-2-0",
        "modelName": "IMPREZA GG STI (GGA) / GD (GDB) 2.0",
        "engineId": "e-subaru-impreza-gg-sti-gga-gd-gdb-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2007,
        "yearRangeText": "2005 - 2007",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-160",
    "sku": "P54 039N",
    "name": "Brembo Pad NAO P54 039N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26296FE040",
      "GDB3349",
      "DB1678"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2230,
    "supplierListPrice": 2230,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-160",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-160-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-evolution-7-8-9-front-4-pot-rear-2-pot-brembo-caliper",
        "modelName": "Lancer EVOLUTION 7 8 9 (Front 4 Pot/Rear 2 Pot Brembo Caliper)",
        "engineId": "e-mitsubishi-lancer-evolution-7-8-9-front-4-pot-rear-2-pot-brembo-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-160-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-evolution-x-cz4a",
        "modelName": "Lancer EVOLUTION X (CZ4A)",
        "engineId": "e-mitsubishi-lancer-evolution-x-cz4a",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2015,
        "yearRangeText": "2008 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-160-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-impreza-gg-sti-gga-gd-gdb-2-0",
        "modelName": "IMPREZA GG STI (GGA) / GD (GDB) 2.0",
        "engineId": "e-subaru-impreza-gg-sti-gga-gd-gdb-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2007,
        "yearRangeText": "2005 - 2007",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-161",
    "sku": "P56 048N",
    "name": "Brembo Pad NAO P56 048N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26696FE000",
      "GDB3350",
      "DB1521",
      "D4060CD00B"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1520,
    "supplierListPrice": 1520,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-161",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-161-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-evolution-7-8-9-front-4-pot-rear-2-pot-brembo-caliper",
        "modelName": "Lancer EVOLUTION 7 8 9 (Front 4 Pot/Rear 2 Pot Brembo Caliper)",
        "engineId": "e-mitsubishi-lancer-evolution-7-8-9-front-4-pot-rear-2-pot-brembo-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-161-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-350z-z33-3-5-skyline-r33-2-6-twin-turbo-4x4",
        "modelName": "350Z Z33 3.5 / SKYLINE R33 2.6 Twin Turbo 4x4",
        "engineId": "e-nissan-350z-z33-3-5-skyline-r33-2-6-twin-turbo-4x4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearRangeText": "2002 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-162",
    "sku": "P54 052N",
    "name": "Brembo Pad NAO P54 052N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4605A584",
      "GDB3488",
      "DB2215"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1900,
    "supplierListPrice": 1900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-162",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-162-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-lancer-evolution-x-cz4a",
        "modelName": "Lancer EVOLUTION X (CZ4A)",
        "engineId": "e-mitsubishi-lancer-evolution-x-cz4a",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2015,
        "yearRangeText": "2008 - 2015",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-163",
    "sku": "P79 032N",
    "name": "Brembo Pad NAO P79 032N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4605B949",
      "GDB3633",
      "5581061M00"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1150,
    "supplierListPrice": 1150,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-163",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-163-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-xpander-1-5",
        "modelName": "XPANDER 1.5",
        "engineId": "e-mitsubishi-xpander-1-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-163-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-suzuki",
        "brandName": "Suzuki",
        "modelId": "m-suzuki-sx4-1-6",
        "modelName": "SX4 1.6",
        "engineId": "e-suzuki-sx4-1-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearRangeText": "2013 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-164",
    "sku": "P54 017N",
    "name": "Brembo Pad NAO P54 017N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MR129104",
      "GDB1126",
      "DB1223"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 990,
    "supplierListPrice": 990,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-164",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-164-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-galant-2-0-vr4-strada-g-wagon-96",
        "modelName": "Galant 2.0 VR4 / Strada G-Wagon (ปี96)",
        "engineId": "e-mitsubishi-galant-2-0-vr4-strada-g-wagon-96",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1996,
        "yearTo": 1996,
        "yearRangeText": "1996",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-165",
    "sku": "P54 020N",
    "name": "Brembo Pad NAO P54 020N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MR205256",
      "GDB1286",
      "DB1297"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1030,
    "supplierListPrice": 1030,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-165",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-165-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-l200-strada-4x2-2-5",
        "modelName": "L200 STRADA 4x2 2.5",
        "engineId": "e-mitsubishi-l200-strada-4x2-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1996,
        "yearRangeText": "1996 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-166",
    "sku": "P54 033N",
    "name": "Brembo Pad NAO P54 033N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MR977365",
      "DB1738"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1190,
    "supplierListPrice": 1190,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-166",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-166-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-l200-strada-g-wagon-4x4",
        "modelName": "L200 STRADA G-WAGON 4x4",
        "engineId": "e-mitsubishi-l200-strada-g-wagon-4x4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1996,
        "yearTo": 2007,
        "yearRangeText": "1996 - 2007",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-167",
    "sku": "P54 063N",
    "name": "Brembo Pad NAO P54 063N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4605B987 / 4605B562"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1230,
    "supplierListPrice": 1230,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-167",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-167-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-outlander-2-4",
        "modelName": "OUTLANDER 2.4",
        "engineId": "e-mitsubishi-outlander-2-4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2021,
        "yearRangeText": "2021 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-168",
    "sku": "P54 038N",
    "name": "Brembo Pad NAO P54 038N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4605A198T",
      "GDB7704",
      "DB1774"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1020,
    "supplierListPrice": 1020,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-168",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-168-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-triton-2-4l-2-5d-2wd",
        "modelName": "TRITON 2.4L 2.5D 2WD",
        "engineId": "e-mitsubishi-triton-2-4l-2-5d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2014,
        "yearRangeText": "2005 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-168-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-triton-2-5d-3-2d-2wd-plus-4wd",
        "modelName": "TRITON 2.5D 3.2D 2WD Plus / 4WD",
        "engineId": "e-mitsubishi-triton-2-5d-3-2d-2wd-plus-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2014,
        "yearRangeText": "2005 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-168-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-triton-2-5d-2wd",
        "modelName": "TRITON 2.5D 2WD",
        "engineId": "e-mitsubishi-triton-2-5d-2wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2019,
        "yearRangeText": "2015 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-168-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-triton-2-4l-2-5d-2wd-plus-4wd",
        "modelName": "TRITON 2.4L 2.5D 2WD Plus / 4WD",
        "engineId": "e-mitsubishi-triton-2-4l-2-5d-2wd-plus-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2019,
        "yearRangeText": "2015 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-168-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-pajero-sport-4x2-4x4-2-4l-2-5d-3-0d-3-2d",
        "modelName": "PAJERO SPORT 4x2 4x4 (2.4L 2.5D 3.0D 3.2D)",
        "engineId": "e-mitsubishi-pajero-sport-4x2-4x4-2-4l-2-5d-3-0d-3-2d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2014,
        "yearRangeText": "2008 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-168-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-pajero-sport-4x2-4x4-2-5d",
        "modelName": "PAJERO SPORT 4x2 4x4 2.5D",
        "engineId": "e-mitsubishi-pajero-sport-4x2-4x4-2-5d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2015,
        "yearRangeText": "2014 - 2015",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-169",
    "sku": "P54 029N",
    "name": "Brembo Pad NAO P54 029N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MR527868"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1740,
    "supplierListPrice": 1740,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-169",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-169-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-pajero-shogun-v76w-99",
        "modelName": "PAJERO SHOGUN V76W (ปี99)",
        "engineId": "e-mitsubishi-pajero-shogun-v76w-99",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1999,
        "yearTo": 1999,
        "yearRangeText": "1999",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-170",
    "sku": "P54 026B",
    "name": "Brembo Pad Low-M P54 026B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4605A783",
      "GDB3239",
      "DB1390"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 830,
    "supplierListPrice": 830,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-170",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-170-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-pajero-sport-4x2-4x4-2-4d",
        "modelName": "PAJERO SPORT 4x2 4x4 2.4D",
        "engineId": "e-mitsubishi-pajero-sport-4x2-4x4-2-4d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-171",
    "sku": "P54 026N",
    "name": "Brembo Pad NAO P54 026N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4605A783",
      "GDB3239",
      "DB1390"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 900,
    "supplierListPrice": 900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-171",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-171-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-pajero-sport-4x2-4x4-2-4d",
        "modelName": "PAJERO SPORT 4x2 4x4 2.4D",
        "engineId": "e-mitsubishi-pajero-sport-4x2-4x4-2-4d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-172",
    "sku": "P54 019N",
    "name": "Brembo Pad NAO P54 019N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MR389514"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2600,
    "supplierListPrice": 2600,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-172",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-172-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-3000-gt-z16",
        "modelName": "3000 GT Z16",
        "engineId": "e-mitsubishi-3000-gt-z16",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1990,
        "yearTo": 1990,
        "yearRangeText": "1990",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-173",
    "sku": "P54 048N",
    "name": "Brembo Pad NAO P54 048N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "MR389574"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1700,
    "supplierListPrice": 1700,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-173",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-173-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-mitsubishi",
        "brandName": "Mitsubishi",
        "modelId": "m-mitsubishi-3000-gt-z16",
        "modelName": "3000 GT Z16",
        "engineId": "e-mitsubishi-3000-gt-z16",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1990,
        "yearTo": 1990,
        "yearRangeText": "1990",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-174",
    "sku": "P56 070N",
    "name": "Brembo Pad NAO P56 070N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D10601HJ0A",
      "GDB7742",
      "DB1830"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1060,
    "supplierListPrice": 1060,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-174",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-174-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-march-k13-eco-1-2-almera-eco-1-2",
        "modelName": "MARCH K13 ECO 1.2 / ALMERA ECO 1.2",
        "engineId": "e-nissan-march-k13-eco-1-2-almera-eco-1-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearRangeText": "2010 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-174-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-almera-eco-n17-1-2",
        "modelName": "ALMERA ECO N17 1.2",
        "engineId": "e-nissan-almera-eco-n17-1-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2019,
        "yearRangeText": "2012 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-174-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-note-1-2",
        "modelName": "NOTE 1.2",
        "engineId": "e-nissan-note-1-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-174-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-tiida-1-6-1-8",
        "modelName": "TIIDA 1.6 1.8",
        "engineId": "e-nissan-tiida-1-6-1-8",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2012,
        "yearRangeText": "2006 - 2012",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-174-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-yaris-ativ-ac100-sport-smart-1-2l",
        "modelName": "YARIS ATIV (AC100) Sport/Smart 1.2L",
        "engineId": "e-toyota-yaris-ativ-ac100-sport-smart-1-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2022,
        "yearRangeText": "2022 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-175",
    "sku": "P56 088B",
    "name": "Brembo Pad Low-M P56 088B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "41060-AX085",
      "GDB7743",
      "DB1819"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 900,
    "supplierListPrice": 900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-175",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-175-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-livina-l11-1-6-cube-z11-02",
        "modelName": "LIVINA L11 1.6 / CUBE Z11 (ปี02->)",
        "engineId": "e-nissan-livina-l11-1-6-cube-z11-02",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-176",
    "sku": "P56 088N",
    "name": "Brembo Pad NAO P56 088N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "41060-AX085",
      "GDB7743",
      "DB1819"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 990,
    "supplierListPrice": 990,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-176",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-176-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-livina-l11-1-6-cube-z11-02",
        "modelName": "LIVINA L11 1.6 / CUBE Z11 (ปี02->)",
        "engineId": "e-nissan-livina-l11-1-6-cube-z11-02",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-177",
    "sku": "P23 126B",
    "name": "Brembo Pad Low-M P23 126B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D10601FC0A",
      "GDB7886"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1400,
    "supplierListPrice": 1400,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-177",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-177-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-juke-f15-1-5-1-6-cube-z12-09",
        "modelName": "JUKE F15 1.5 1.6 / CUBE Z12 (ปี09->)",
        "engineId": "e-nissan-juke-f15-1-5-1-6-cube-z12-09",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearRangeText": "2009 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-177-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-sylphy-1-6-1-8-pulsar",
        "modelName": "SYLPHY 1.6 1.8 / PULSAR",
        "engineId": "e-nissan-sylphy-1-6-1-8-pulsar",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearRangeText": "2013 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-178",
    "sku": "P23 126N",
    "name": "Brembo Pad NAO P23 126N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D10601FC0A",
      "GDB7886"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1650,
    "supplierListPrice": 1650,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-178",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-178-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-juke-f15-1-5-1-6-cube-z12-09",
        "modelName": "JUKE F15 1.5 1.6 / CUBE Z12 (ปี09->)",
        "engineId": "e-nissan-juke-f15-1-5-1-6-cube-z12-09",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearRangeText": "2009 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-178-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-sylphy-1-6-1-8-pulsar",
        "modelName": "SYLPHY 1.6 1.8 / PULSAR",
        "engineId": "e-nissan-sylphy-1-6-1-8-pulsar",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearRangeText": "2013 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-179",
    "sku": "P56 068N",
    "name": "Brembo Pad NAO P56 068N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D40604BA0B",
      "GDB7822",
      "DB1509"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1560,
    "supplierListPrice": 1560,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-179",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-179-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-sylphy-1-6-1-8-pulsar",
        "modelName": "SYLPHY 1.6 1.8 / PULSAR",
        "engineId": "e-nissan-sylphy-1-6-1-8-pulsar",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearRangeText": "2013 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-179-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-teana-j32-2-0-2-5",
        "modelName": "TEANA J32 2.0 2.5",
        "engineId": "e-nissan-teana-j32-2-0-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2013,
        "yearRangeText": "2009 - 2013",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-179-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-x-trail-t32-2-0l-2-5l",
        "modelName": "X-TRAIL T32 2.0L 2.5L",
        "engineId": "e-nissan-x-trail-t32-2-0l-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2019,
        "yearRangeText": "2014 - 2019",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-180",
    "sku": "P56 021N",
    "name": "Brembo Pad NAO P56 021N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4106040U90",
      "GDB1003",
      "DB1187"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 930,
    "supplierListPrice": 930,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-180",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-180-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-cefiro-a32-a33-2-0-3-0",
        "modelName": "CEFIRO A32 A33 2.0 3.0",
        "engineId": "e-nissan-cefiro-a32-a33-2-0-3-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1995,
        "yearTo": 2004,
        "yearRangeText": "1995 - 2004",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-180-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-teana-j31-2-3",
        "modelName": "TEANA J31 2.3",
        "engineId": "e-nissan-teana-j31-2-3",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-181",
    "sku": "P56 029N",
    "name": "Brembo Pad NAO P56 029N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "440600N690",
      "GDB1172",
      "DB1247"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1090,
    "supplierListPrice": 1090,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-181",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-181-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-cefiro-a32-2-0-3-0",
        "modelName": "CEFIRO A32 2.0 3.0",
        "engineId": "e-nissan-cefiro-a32-2-0-3-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1995,
        "yearRangeText": "1995 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-182",
    "sku": "P56 039B",
    "name": "Brembo Pad Low-M P56 039B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "410602N290",
      "GDB3208",
      "DB1148"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 950,
    "supplierListPrice": 950,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-182",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-182-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-cefiro-2-0-12v-a31-89-240sx",
        "modelName": "CEFIRO 2.0 12V A31 (ปี89) / 240SX",
        "engineId": "e-nissan-cefiro-2-0-12v-a31-89-240sx",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1989,
        "yearTo": 1989,
        "yearRangeText": "1989",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-183",
    "sku": "P56 039N",
    "name": "Brembo Pad NAO P56 039N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "410602N290",
      "GDB3208",
      "DB1148"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 990,
    "supplierListPrice": 990,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-183",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-183-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-cefiro-2-0-12v-a31-89-240sx",
        "modelName": "CEFIRO 2.0 12V A31 (ปี89) / 240SX",
        "engineId": "e-nissan-cefiro-2-0-12v-a31-89-240sx",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1989,
        "yearTo": 1989,
        "yearRangeText": "1989",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-184",
    "sku": "P30 002B",
    "name": "Brembo Pad Low-M P30 002B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4106032R93 / 410606J091",
      "GDB1008",
      "DB1165"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1100,
    "supplierListPrice": 1100,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-184",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-184-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-cefiro-2-0-24v-a31-bluebird-u12-skyline-r33",
        "modelName": "CEFIRO 2.0 24V A31 / Bluebird U12 / Skyline R33",
        "engineId": "e-nissan-cefiro-2-0-24v-a31-bluebird-u12-skyline-r33",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-185",
    "sku": "P30 002N",
    "name": "Brembo Pad NAO P30 002N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4106032R93 / 410606J091",
      "GDB1008",
      "DB1165"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1140,
    "supplierListPrice": 1140,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-185",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-185-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-cefiro-2-0-24v-a31-bluebird-u12-skyline-r33",
        "modelName": "CEFIRO 2.0 24V A31 / Bluebird U12 / Skyline R33",
        "engineId": "e-nissan-cefiro-2-0-24v-a31-bluebird-u12-skyline-r33",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-186",
    "sku": "P30 003B",
    "name": "Brembo Pad Low-M P30 003B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "44060 65 E90",
      "GDB1002",
      "DB1166"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1300,
    "supplierListPrice": 1300,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-186",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-186-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-cefiro-2-0-a31-bluebird-u12",
        "modelName": "CEFIRO 2.0 A31 / Bluebird U12",
        "engineId": "e-nissan-cefiro-2-0-a31-bluebird-u12",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-187",
    "sku": "P54 032B",
    "name": "Brembo Pad Low-M P54 032B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "41060-3L190",
      "GDB3107",
      "DB1308"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1250,
    "supplierListPrice": 1250,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-187",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-187-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-cefiro-3-0-v6-a32-96",
        "modelName": "CEFIRO 3.0 V6 A32 (ปี96)",
        "engineId": "e-nissan-cefiro-3-0-v6-a32-96",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1996,
        "yearTo": 1996,
        "yearRangeText": "1996",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-188",
    "sku": "P54 032N",
    "name": "Brembo Pad NAO P54 032N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "41060-3L190",
      "GDB3107",
      "DB1308"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1230,
    "supplierListPrice": 1230,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-188",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-188-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-cefiro-3-0-v6-a32-96",
        "modelName": "CEFIRO 3.0 V6 A32 (ปี96)",
        "engineId": "e-nissan-cefiro-3-0-v6-a32-96",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1996,
        "yearTo": 1996,
        "yearRangeText": "1996",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-189",
    "sku": "P56 046N",
    "name": "Brembo Pad NAO P56 046N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "440608H385",
      "GDB3294",
      "DB1509"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 660,
    "supplierListPrice": 660,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-189",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-189-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-teana-j31-2-3",
        "modelName": "TEANA J31 2.3",
        "engineId": "e-nissan-teana-j31-2-3",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-189-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-teana-l33-2-0-2-5",
        "modelName": "TEANA L33 2.0 2.5",
        "engineId": "e-nissan-teana-l33-2-0-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-189-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-x-trail-t30-2-0l-2-5l",
        "modelName": "X-TRAIL T30 2.0L 2.5L",
        "engineId": "e-nissan-x-trail-t30-2-0l-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2009,
        "yearRangeText": "2005 - 2009",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-189-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-x-trail-t31-2-0l-2-5l",
        "modelName": "X-TRAIL T31 2.0L 2.5L",
        "engineId": "e-nissan-x-trail-t31-2-0l-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2014,
        "yearRangeText": "2009 - 2014",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-190",
    "sku": "P56 065B",
    "name": "Brembo Pad Low-M P56 065B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D1060JN00A",
      "GDB7876",
      "DB1485"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1050,
    "supplierListPrice": 1050,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-190",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-190-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-teana-j32-2-0-2-5",
        "modelName": "TEANA J32 2.0 2.5",
        "engineId": "e-nissan-teana-j32-2-0-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2013,
        "yearRangeText": "2009 - 2013",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-191",
    "sku": "P56 065N",
    "name": "Brembo Pad NAO P56 065N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D1060JN00A",
      "GDB7876",
      "DB1485"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1090,
    "supplierListPrice": 1090,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-191",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-191-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-teana-j32-2-0-2-5",
        "modelName": "TEANA J32 2.0 2.5",
        "engineId": "e-nissan-teana-j32-2-0-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2013,
        "yearRangeText": "2009 - 2013",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-192",
    "sku": "P56 104B",
    "name": "Brembo Pad Low-M P56 104B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D10603TA0A",
      "GDB7906"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1350,
    "supplierListPrice": 1350,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-192",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-192-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-teana-l33-2-0-2-5",
        "modelName": "TEANA L33 2.0 2.5",
        "engineId": "e-nissan-teana-l33-2-0-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-193",
    "sku": "P56 104N",
    "name": "Brembo Pad NAO P56 104N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D10603TA0A",
      "GDB7906"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1460,
    "supplierListPrice": 1460,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-193",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-193-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-teana-l33-2-0-2-5",
        "modelName": "TEANA L33 2.0 2.5",
        "engineId": "e-nissan-teana-l33-2-0-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-194",
    "sku": "P56 040N",
    "name": "Brembo Pad NAO P56 040N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "410608H785",
      "GDB3293",
      "DB1333"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1420,
    "supplierListPrice": 1420,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-194",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-194-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-x-trail-t30-2-0l-2-5l",
        "modelName": "X-TRAIL T30 2.0L 2.5L",
        "engineId": "e-nissan-x-trail-t30-2-0l-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2009,
        "yearRangeText": "2005 - 2009",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-195",
    "sku": "P79 028N",
    "name": "Brembo Pad NAO P79 028N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D10609N50A / D1060JD00A",
      "GDB3467"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-195",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-195-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-x-trail-t31-2-0l-2-5l",
        "modelName": "X-TRAIL T31 2.0L 2.5L",
        "engineId": "e-nissan-x-trail-t31-2-0l-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2014,
        "yearRangeText": "2009 - 2014",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-196",
    "sku": "P56 098N",
    "name": "Brembo Pad NAO P56 098N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D40604CA0C",
      "GDB3617"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 990,
    "supplierListPrice": 990,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-196",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-196-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-x-trail-t32-2-0l-2-5l-epb",
        "modelName": "X-TRAIL T32 2.0L 2.5L (EPB)",
        "engineId": "e-nissan-x-trail-t32-2-0l-2-5l-epb",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-197",
    "sku": "P56 059B",
    "name": "Brembo Pad Low-M P56 059B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D1060JR70A",
      "GDB7785",
      "DB1835"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1000,
    "supplierListPrice": 1000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-197",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-197-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-navara-d40-4x2-4x4-2-5-ddti",
        "modelName": "NAVARA D40 4x2 4x4 (2.5 DDTi)",
        "engineId": "e-nissan-navara-d40-4x2-4x4-2-5-ddti",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2013,
        "yearRangeText": "2007 - 2013",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-198",
    "sku": "P56 059N",
    "name": "Brembo Pad NAO P56 059N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D1060JR70A",
      "GDB7785",
      "DB1835"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1100,
    "supplierListPrice": 1100,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-198",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-198-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-navara-d40-4x2-4x4-2-5-ddti",
        "modelName": "NAVARA D40 4x2 4x4 (2.5 DDTi)",
        "engineId": "e-nissan-navara-d40-4x2-4x4-2-5-ddti",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2013,
        "yearRangeText": "2007 - 2013",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-199",
    "sku": "P56 118B",
    "name": "Brembo Pad Low-M P56 118B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D10604JA0A",
      "GDB7948",
      "DB2374"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1050,
    "supplierListPrice": 1050,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-199",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-199-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-navara-np300-d23-4x2-4x4-2-5-2-3",
        "modelName": "NAVARA NP300 D23 4x2 4x4 (2.5 2.3)",
        "engineId": "e-nissan-navara-np300-d23-4x2-4x4-2-5-2-3",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-199-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-terra-2-3-2-5",
        "modelName": "TERRA 2.3 2.5",
        "engineId": "e-nissan-terra-2-3-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-200",
    "sku": "P56 118N",
    "name": "Brembo Pad NAO P56 118N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D10604JA0A",
      "GDB7948",
      "DB2374"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1140,
    "supplierListPrice": 1140,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-200",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-200-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-navara-np300-d23-4x2-4x4-2-5-2-3",
        "modelName": "NAVARA NP300 D23 4x2 4x4 (2.5 2.3)",
        "engineId": "e-nissan-navara-np300-d23-4x2-4x4-2-5-2-3",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-200-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-terra-2-3-2-5",
        "modelName": "TERRA 2.3 2.5",
        "engineId": "e-nissan-terra-2-3-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-201",
    "sku": "P56 025B",
    "name": "Brembo Pad Low-M P56 025B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4106037P90",
      "GDB1006",
      "DB1170"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1900,
    "supplierListPrice": 1900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-201",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-201-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-300zx-fairlady-skyline-r32-r33",
        "modelName": "300ZX FAIRLADY / SKYLINE R32 R33",
        "engineId": "e-nissan-300zx-fairlady-skyline-r32-r33",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1989,
        "yearRangeText": "1989 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-201-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-impreza-gc8-sti-gda-wrx-subaru-4-pot-caliper",
        "modelName": "IMPREZA GC8 STI / GDA WRX (Subaru 4 Pot Caliper)",
        "engineId": "e-subaru-impreza-gc8-sti-gda-wrx-subaru-4-pot-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2007,
        "yearRangeText": "1997 - 2007",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-202",
    "sku": "P56 025N",
    "name": "Brembo Pad NAO P56 025N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "4106037P90",
      "GDB1006",
      "DB1170"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-202",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-202-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-300zx-fairlady-skyline-r32-r33",
        "modelName": "300ZX FAIRLADY / SKYLINE R32 R33",
        "engineId": "e-nissan-300zx-fairlady-skyline-r32-r33",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1989,
        "yearRangeText": "1989 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-202-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-impreza-gc8-sti-gda-wrx-subaru-4-pot-caliper",
        "modelName": "IMPREZA GC8 STI / GDA WRX (Subaru 4 Pot Caliper)",
        "engineId": "e-subaru-impreza-gc8-sti-gda-wrx-subaru-4-pot-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2007,
        "yearRangeText": "1997 - 2007",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-203",
    "sku": "P78 016B",
    "name": "Brembo Pad Low-M P78 016B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26696FA000",
      "GDB3308",
      "DB1220"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-203",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-203-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-300zx-fairlady-skyline-r32-r33",
        "modelName": "300ZX FAIRLADY / SKYLINE R32 R33",
        "engineId": "e-nissan-300zx-fairlady-skyline-r32-r33",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1989,
        "yearRangeText": "1989 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-203-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-impreza-gc8-sti-gda-wrx-subaru-2-pot-caliper",
        "modelName": "IMPREZA GC8 STI / GDA WRX (Subaru 2 Pot Caliper)",
        "engineId": "e-subaru-impreza-gc8-sti-gda-wrx-subaru-2-pot-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2007,
        "yearRangeText": "1997 - 2007",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-204",
    "sku": "P78 016N",
    "name": "Brembo Pad NAO P78 016N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26696FA000",
      "GDB3308",
      "DB1220"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2360,
    "supplierListPrice": 2360,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-204",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-204-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-300zx-fairlady-skyline-r32-r33",
        "modelName": "300ZX FAIRLADY / SKYLINE R32 R33",
        "engineId": "e-nissan-300zx-fairlady-skyline-r32-r33",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1989,
        "yearRangeText": "1989 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-204-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-impreza-gc8-sti-gda-wrx-subaru-2-pot-caliper",
        "modelName": "IMPREZA GC8 STI / GDA WRX (Subaru 2 Pot Caliper)",
        "engineId": "e-subaru-impreza-gc8-sti-gda-wrx-subaru-2-pot-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2007,
        "yearRangeText": "1997 - 2007",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-205",
    "sku": "P56 089N",
    "name": "Brembo Pad NAO P56 089N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D1060JL00E",
      "GDB3505"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 3200,
    "supplierListPrice": 3200,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-205",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-205-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-370z-z34-3-7-nismo-front-4-pot-rear-2-pot-caliper",
        "modelName": "370Z Z34 3.7 / NISMO (Front 4 Pot/Rear 2 Pot Caliper)",
        "engineId": "e-nissan-370z-z34-3-7-nismo-front-4-pot-rear-2-pot-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearRangeText": "2010 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-206",
    "sku": "P56 095B",
    "name": "Brembo Pad Low-M P56 095B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D4060JL00A",
      "GDB3515"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2300,
    "supplierListPrice": 2300,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-206",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-206-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-370z-z34-3-7-nismo-front-4-pot-rear-2-pot-caliper",
        "modelName": "370Z Z34 3.7 / NISMO (Front 4 Pot/Rear 2 Pot Caliper)",
        "engineId": "e-nissan-370z-z34-3-7-nismo-front-4-pot-rear-2-pot-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearRangeText": "2010 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-207",
    "sku": "P56 095N",
    "name": "Brembo Pad NAO P56 095N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "D4060JL00A",
      "GDB3515"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2600,
    "supplierListPrice": 2600,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-207",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-207-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-nissan",
        "brandName": "Nissan",
        "modelId": "m-nissan-370z-z34-3-7-nismo-front-4-pot-rear-2-pot-caliper",
        "modelName": "370Z Z34 3.7 / NISMO (Front 4 Pot/Rear 2 Pot Caliper)",
        "engineId": "e-nissan-370z-z34-3-7-nismo-front-4-pot-rear-2-pot-caliper",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearRangeText": "2010 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-208",
    "sku": "P78 007B",
    "name": "Brembo Pad Low-M P78 007B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26296AA040",
      "GDB1179",
      "DB1219"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2500,
    "supplierListPrice": 2500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-208",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-208-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-impreza-gc-gf-1-6-1-8-2-0",
        "modelName": "IMPREZA GC GF 1.6 1.8 2.0",
        "engineId": "e-subaru-impreza-gc-gf-1-6-1-8-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1992,
        "yearTo": 1999,
        "yearRangeText": "1992 - 1999",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-209",
    "sku": "P78 010B",
    "name": "Brembo Pad Low-M P78 010B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26296AC030",
      "GDB3217",
      "DB1342"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-209",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-209-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-impreza-gc8-2-0t",
        "modelName": "IMPREZA GC8 2.0T",
        "engineId": "e-subaru-impreza-gc8-2-0t",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1999,
        "yearTo": 1999,
        "yearRangeText": "1999",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-210",
    "sku": "P78 013X",
    "name": "Brembo Pad XTRA P78 013X",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26296AG020",
      "GDB3371",
      "DB1491"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2700,
    "supplierListPrice": 2700,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-210",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-210-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-xv-gp-2-0-awd",
        "modelName": "XV GP 2.0 AWD",
        "engineId": "e-subaru-xv-gp-2-0-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2015,
        "yearRangeText": "2012 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-210-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-forester-sh-2-0-legacy-bm-br9-2-5-gt",
        "modelName": "FORESTER SH 2.0 / LEGACY BM BR9 2.5 GT",
        "engineId": "e-subaru-forester-sh-2-0-legacy-bm-br9-2-5-gt",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2013,
        "yearRangeText": "2008 - 2013",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-210-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-gt86-2-0l",
        "modelName": "GT86 2.0L",
        "engineId": "e-toyota-gt86-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-211",
    "sku": "P78 013B",
    "name": "Brembo Pad Low-M P78 013B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26296AG020",
      "GDB3371",
      "DB1491"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1600,
    "supplierListPrice": 1600,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-211",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-211-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-xv-gp-2-0-awd",
        "modelName": "XV GP 2.0 AWD",
        "engineId": "e-subaru-xv-gp-2-0-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2015,
        "yearRangeText": "2012 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-211-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-forester-sh-2-0-legacy-bm-br9-2-5-gt",
        "modelName": "FORESTER SH 2.0 / LEGACY BM BR9 2.5 GT",
        "engineId": "e-subaru-forester-sh-2-0-legacy-bm-br9-2-5-gt",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2013,
        "yearRangeText": "2008 - 2013",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-211-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-gt86-2-0l",
        "modelName": "GT86 2.0L",
        "engineId": "e-toyota-gt86-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-212",
    "sku": "P78 013N",
    "name": "Brembo Pad NAO P78 013N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26296AG020",
      "GDB3371",
      "DB1491"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1350,
    "supplierListPrice": 1350,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-212",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-212-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-xv-gp-2-0-awd",
        "modelName": "XV GP 2.0 AWD",
        "engineId": "e-subaru-xv-gp-2-0-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2015,
        "yearRangeText": "2012 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-212-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-forester-sh-2-0-legacy-bm-br9-2-5-gt",
        "modelName": "FORESTER SH 2.0 / LEGACY BM BR9 2.5 GT",
        "engineId": "e-subaru-forester-sh-2-0-legacy-bm-br9-2-5-gt",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2013,
        "yearRangeText": "2008 - 2013",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-212-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-gt86-2-0l",
        "modelName": "GT86 2.0L",
        "engineId": "e-toyota-gt86-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-213",
    "sku": "P78 021B",
    "name": "Brembo Pad Low-M P78 021B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26296SC000",
      "GDB3519"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-213",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-213-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-xv-gp-2-0-facelift-awd",
        "modelName": "XV GP 2.0 Facelift AWD",
        "engineId": "e-subaru-xv-gp-2-0-facelift-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2017,
        "yearRangeText": "2015 - 2017",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-213-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-forester-sj-2-0-awd",
        "modelName": "FORESTER SJ 2.0 AWD",
        "engineId": "e-subaru-forester-sj-2-0-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2019,
        "yearRangeText": "2013 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-213-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-brz-2-0",
        "modelName": "BRZ 2.0",
        "engineId": "e-subaru-brz-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-214",
    "sku": "P78 021N",
    "name": "Brembo Pad NAO P78 021N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26296SC000",
      "GDB3519"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-214",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-214-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-xv-gp-2-0-facelift-awd",
        "modelName": "XV GP 2.0 Facelift AWD",
        "engineId": "e-subaru-xv-gp-2-0-facelift-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2017,
        "yearRangeText": "2015 - 2017",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-214-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-forester-sj-2-0-awd",
        "modelName": "FORESTER SJ 2.0 AWD",
        "engineId": "e-subaru-forester-sj-2-0-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2019,
        "yearRangeText": "2013 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-214-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-brz-2-0",
        "modelName": "BRZ 2.0",
        "engineId": "e-subaru-brz-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-215",
    "sku": "P78 020N",
    "name": "Brembo Pad NAO P78 020N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26696AG010",
      "GDB3373",
      "DB1803"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1180,
    "supplierListPrice": 1180,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-215",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-215-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-xv-gp-2-0-gp-2-0-facelift-awd",
        "modelName": "XV GP 2.0 / GP 2.0 Facelift AWD",
        "engineId": "e-subaru-xv-gp-2-0-gp-2-0-facelift-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2017,
        "yearRangeText": "2012 - 2017",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-215-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-forester-sh-2-0-legacy-bm-br9-2-5-gt",
        "modelName": "FORESTER SH 2.0 / LEGACY BM BR9 2.5 GT",
        "engineId": "e-subaru-forester-sh-2-0-legacy-bm-br9-2-5-gt",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2013,
        "yearRangeText": "2008 - 2013",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-215-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-forester-sj-2-0-awd",
        "modelName": "FORESTER SJ 2.0 AWD",
        "engineId": "e-subaru-forester-sj-2-0-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2019,
        "yearRangeText": "2013 - 2019",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-215-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-gt86-2-0l",
        "modelName": "GT86 2.0L",
        "engineId": "e-toyota-gt86-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-216",
    "sku": "P78 028N",
    "name": "Brembo Pad NAO P78 028N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26296AN00A / 26296FL030"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1800,
    "supplierListPrice": 1800,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-216",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-216-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-xv-gt-17-forester-sk-18",
        "modelName": "XV GT (ปี17) / Forester SK (ปี18)",
        "engineId": "e-subaru-xv-gt-17-forester-sk-18",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearTo": 2018,
        "yearRangeText": "2017 - 2018",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-217",
    "sku": "P78 026N",
    "name": "Brembo Pad NAO P78 026N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26696AL000"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1800,
    "supplierListPrice": 1800,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-217",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-217-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-xv-gt-17-forester-sk-18",
        "modelName": "XV GT (ปี17) / Forester SK (ปี18)",
        "engineId": "e-subaru-xv-gt-17-forester-sk-18",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearTo": 2018,
        "yearRangeText": "2017 - 2018",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-217-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-levorg-1-6-2-0",
        "modelName": "Levorg 1.6 2.0",
        "engineId": "e-subaru-levorg-1-6-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-218",
    "sku": "P78 017B",
    "name": "Brembo Pad Low-M P78 017B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26296AG000",
      "GDB3372"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2400,
    "supplierListPrice": 2400,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-218",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-218-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-forester-sj-xt-2-0-turbo-awd",
        "modelName": "FORESTER SJ XT 2.0 Turbo AWD",
        "engineId": "e-subaru-forester-sj-xt-2-0-turbo-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-218-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-levorg-1-6-2-0",
        "modelName": "Levorg 1.6 2.0",
        "engineId": "e-subaru-levorg-1-6-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-219",
    "sku": "P78 017N",
    "name": "Brembo Pad NAO P78 017N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26296AG000",
      "GDB3372"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2500,
    "supplierListPrice": 2500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-219",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-219-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-forester-sj-xt-2-0-turbo-awd",
        "modelName": "FORESTER SJ XT 2.0 Turbo AWD",
        "engineId": "e-subaru-forester-sj-xt-2-0-turbo-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-219-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-levorg-1-6-2-0",
        "modelName": "Levorg 1.6 2.0",
        "engineId": "e-subaru-levorg-1-6-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-220",
    "sku": "P78 018N",
    "name": "Brembo Pad NAO P78 018N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "26696CA000",
      "GDB3442",
      "DB1789"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1150,
    "supplierListPrice": 1150,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-220",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-220-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-subaru",
        "brandName": "Subaru",
        "modelId": "m-subaru-forester-sj-xt-2-0-turbo-awd",
        "modelName": "FORESTER SJ XT 2.0 Turbo AWD",
        "engineId": "e-subaru-forester-sj-xt-2-0-turbo-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-221",
    "sku": "P79 024N",
    "name": "Brembo Pad NAO P79 024N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-BZ010",
      "GDB7656"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 990,
    "supplierListPrice": 990,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-221",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-221-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-suzuki",
        "brandName": "Suzuki",
        "modelId": "m-suzuki-apv-1-6-carry-1-6",
        "modelName": "APV 1.6 / CARRY 1.6",
        "engineId": "e-suzuki-apv-1-6-carry-1-6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2015,
        "yearRangeText": "2004 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-221-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-avanza-1-3-1-5-carry-1-6-04-apv",
        "modelName": "AVANZA 1.3/1.5 / CARRY 1.6 (ปี04) / APV",
        "engineId": "e-toyota-avanza-1-3-1-5-carry-1-6-04-apv",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2011,
        "yearRangeText": "2004 - 2011",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-222",
    "sku": "P61 108N",
    "name": "Brembo Pad NAO P61 108N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "5581082K00 / 5581072J00"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1140,
    "supplierListPrice": 1140,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-222",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-222-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-suzuki",
        "brandName": "Suzuki",
        "modelId": "m-suzuki-celerio-1-0-p54-049",
        "modelName": "CELERIO 1.0 (ใช้แทน P54 049)",
        "engineId": "e-suzuki-celerio-1-0-p54-049",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-222-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-suzuki",
        "brandName": "Suzuki",
        "modelId": "m-suzuki-spacia-0-7-hybrid-hustler-p54-049",
        "modelName": "Spacia 0.7 Hybrid / Hustler (ใช้แทน P54 049)",
        "engineId": "e-suzuki-spacia-0-7-hybrid-hustler-p54-049",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-223",
    "sku": "P79 012N",
    "name": "Brembo Pad NAO P79 012N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "5581084M10"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 800,
    "supplierListPrice": 800,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-223",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-223-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-suzuki",
        "brandName": "Suzuki",
        "modelId": "m-suzuki-celerio-avk310-1-0-14",
        "modelName": "CELERIO AVK310 1.0 (ปี14)",
        "engineId": "e-suzuki-celerio-avk310-1-0-14",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-223-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-bb-1-5",
        "modelName": "BB 1.5",
        "engineId": "e-toyota-bb-1-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2012,
        "yearRangeText": "2006 - 2012",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-224",
    "sku": "P79 023N",
    "name": "Brembo Pad NAO P79 023N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "5581057K00",
      "GDB7691",
      "DB1818"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1000,
    "supplierListPrice": 1000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-224",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-224-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-suzuki",
        "brandName": "Suzuki",
        "modelId": "m-suzuki-swift-1-5",
        "modelName": "SWIFT 1.5",
        "engineId": "e-suzuki-swift-1-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2011,
        "yearRangeText": "2009 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-224-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-suzuki",
        "brandName": "Suzuki",
        "modelId": "m-suzuki-swift-1-2-ciaz-1-2",
        "modelName": "SWIFT 1.2 / CIAZ 1.2",
        "engineId": "e-suzuki-swift-1-2-ciaz-1-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2017,
        "yearRangeText": "2012 - 2017",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-225",
    "sku": "P79 044N",
    "name": "Brembo Pad NAO P79 044N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "5581052R200"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1000,
    "supplierListPrice": 1000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-225",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-225-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-suzuki",
        "brandName": "Suzuki",
        "modelId": "m-suzuki-swift-1-2",
        "modelName": "SWIFT 1.2",
        "engineId": "e-suzuki-swift-1-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-226",
    "sku": "P79 029N",
    "name": "Brembo Pad NAO P79 029N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "5580068R10 / 5580061M00"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1010,
    "supplierListPrice": 1010,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-226",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-226-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-suzuki",
        "brandName": "Suzuki",
        "modelId": "m-suzuki-swift-1-2-18",
        "modelName": "SWIFT 1.2 (ปี18)",
        "engineId": "e-suzuki-swift-1-2-18",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-227",
    "sku": "P79 040N",
    "name": "Brembo Pad NAO P79 040N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "5581078R00"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1600,
    "supplierListPrice": 1600,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-227",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-227-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-suzuki",
        "brandName": "Suzuki",
        "modelId": "m-suzuki-jimny-1-5-awd",
        "modelName": "Jimny 1.5 AWD",
        "engineId": "e-suzuki-jimny-1-5-awd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearTo": 2018,
        "yearRangeText": "2018",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-228",
    "sku": "P44 016B",
    "name": "Brembo Pad Low-M P44 016B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "LR003655",
      "GDB1709"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1600,
    "supplierListPrice": 1600,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-228",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-228-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-proton",
        "brandName": "Proton",
        "modelId": "m-proton-preve-1-6-cr6s",
        "modelName": "Preve 1.6 (CR6S)",
        "engineId": "e-proton-preve-1-6-cr6s",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearRangeText": "2011 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-229",
    "sku": "P44 016N",
    "name": "Brembo Pad NAO P44 016N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "LR003655",
      "GDB1709"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-229",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-229-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-proton",
        "brandName": "Proton",
        "modelId": "m-proton-preve-1-6-cr6s",
        "modelName": "Preve 1.6 (CR6S)",
        "engineId": "e-proton-preve-1-6-cr6s",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearRangeText": "2011 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-230",
    "sku": "P66 003N",
    "name": "Brembo Pad NAO P66 003N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "PW895175"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1090,
    "supplierListPrice": 1090,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-230",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-230-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-proton",
        "brandName": "Proton",
        "modelId": "m-proton-exora-preve-12-suprima-s",
        "modelName": "Exora / Preve (ปี12) / Suprima S",
        "engineId": "e-proton-exora-preve-12-suprima-s",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-231",
    "sku": "P66 005N",
    "name": "Brembo Pad NAO P66 005N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "PW990402"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 990,
    "supplierListPrice": 990,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-231",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-231-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-proton",
        "brandName": "Proton",
        "modelId": "m-proton-exora-1-6-11",
        "modelName": "Exora 1.6 (ปี11)",
        "engineId": "e-proton-exora-1-6-11",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearRangeText": "2011 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-232",
    "sku": "P66 001N",
    "name": "Brembo Pad NAO P66 001N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "PW891172",
      "GDB7683"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2180,
    "supplierListPrice": 2180,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-232",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-232-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-proton",
        "brandName": "Proton",
        "modelId": "m-proton-persona-gen-2-neo-1-6-07",
        "modelName": "Persona / Gen 2 / Neo 1.6 (ปี07)",
        "engineId": "e-proton-persona-gen-2-neo-1-6-07",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearRangeText": "2007 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-233",
    "sku": "P66 002N",
    "name": "Brembo Pad NAO P66 002N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "PW891182",
      "GDB7688"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1100,
    "supplierListPrice": 1100,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-233",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-233-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-proton",
        "brandName": "Proton",
        "modelId": "m-proton-persona-gen-2-neo-1-6-07",
        "modelName": "Persona / Gen 2 / Neo 1.6 (ปี07)",
        "engineId": "e-proton-persona-gen-2-neo-1-6-07",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearRangeText": "2007 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-234",
    "sku": "P82 003N",
    "name": "Brembo Pad NAO P82 003N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "271942-100114",
      "GDB7907"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1510,
    "supplierListPrice": 1510,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-234",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-234-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-tata",
        "brandName": "Tata",
        "modelId": "m-tata-xenon-2-2",
        "modelName": "XENON 2.2",
        "engineId": "e-tata-xenon-2-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearRangeText": "2006 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-235",
    "sku": "P83 062N",
    "name": "Brembo Pad NAO P83 062N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-33240",
      "GDB7224",
      "DB1462"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 950,
    "supplierListPrice": 950,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-235",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-235-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-alphard-i-2-4l-3-0l-v6",
        "modelName": "ALPHARD I 2.4L 3.0L V6",
        "engineId": "e-toyota-alphard-i-2-4l-3-0l-v6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2004,
        "yearRangeText": "2002 - 2004",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-235-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-acv30-2-0-2-4",
        "modelName": "CAMRY ACV30 2.0 2.4",
        "engineId": "e-toyota-camry-acv30-2-0-2-4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2006,
        "yearRangeText": "2002 - 2006",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-235-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-wish-g-q-s-2-0l",
        "modelName": "WISH G/Q/S 2.0L",
        "engineId": "e-toyota-wish-g-q-s-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2010,
        "yearRangeText": "2004 - 2010",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-236",
    "sku": "P83 056N",
    "name": "Brembo Pad NAO P83 056N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04460-28040",
      "GDB3249",
      "DB1660"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1090,
    "supplierListPrice": 1090,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-236",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-236-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-alphard-i-2-4l-3-0l-v6",
        "modelName": "ALPHARD I 2.4L 3.0L V6",
        "engineId": "e-toyota-alphard-i-2-4l-3-0l-v6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2004,
        "yearRangeText": "2002 - 2004",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-236-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-alphard-h1-anh10-2-4l-3-0l",
        "modelName": "ALPHARD (H1) ANH10 2.4L 3.0L",
        "engineId": "e-toyota-alphard-h1-anh10-2-4l-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2008,
        "yearRangeText": "2003 - 2008",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-236-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-estima-lucida-2-4l-3-0l",
        "modelName": "ESTIMA / LUCIDA 2.4L 3.0L",
        "engineId": "e-toyota-estima-lucida-2-4l-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-237",
    "sku": "P83 105N",
    "name": "Brembo Pad NAO P83 105N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-33270",
      "GDB7677",
      "DB1490"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1350,
    "supplierListPrice": 1350,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-237",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-237-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-alphard-h1-anh10-2-4l-3-0l",
        "modelName": "ALPHARD (H1) ANH10 2.4L 3.0L",
        "engineId": "e-toyota-alphard-h1-anh10-2-4l-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2008,
        "yearRangeText": "2003 - 2008",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-237-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-es300-xv30-3-0l-vvti-24v",
        "modelName": "ES300 (XV30) 3.0L VVTi 24V",
        "engineId": "e-lexus-es300-xv30-3-0l-vvti-24v",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2006,
        "yearRangeText": "2002 - 2006",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-238",
    "sku": "P83 099N",
    "name": "Brembo Pad NAO P83 099N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-28520",
      "GDB3455",
      "DB1913"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1380,
    "supplierListPrice": 1380,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-238",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-238-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-alphard-h2-anh20-2-4l-3-5l",
        "modelName": "ALPHARD (H2) ANH20 2.4L 3.5L",
        "engineId": "e-toyota-alphard-h2-anh20-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2014,
        "yearRangeText": "2008 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-238-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-alphard-h3-ah30-2-4l-3-5l",
        "modelName": "ALPHARD (H3) AH30 2.4L 3.5L",
        "engineId": "e-toyota-alphard-h3-ah30-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-238-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-estima-2-4l-hybrid",
        "modelName": "ESTIMA 2.4L Hybrid",
        "engineId": "e-toyota-estima-2-4l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2015,
        "yearRangeText": "2007 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-238-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vellfire-h2-2-4l-3-5l",
        "modelName": "VELLFIRE (H2) 2.4L 3.5L",
        "engineId": "e-toyota-vellfire-h2-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2014,
        "yearRangeText": "2008 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-238-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vellfire-h3-2-4l-3-5l",
        "modelName": "VELLFIRE (H3) 2.4L 3.5L",
        "engineId": "e-toyota-vellfire-h3-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-239",
    "sku": "P83 047B",
    "name": "Brembo Pad Low-M P83 047B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-58010",
      "GDB3456",
      "DB1914"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1150,
    "supplierListPrice": 1150,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-239",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-239-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-alphard-h2-anh20-2-4l-3-5l",
        "modelName": "ALPHARD (H2) ANH20 2.4L 3.5L",
        "engineId": "e-toyota-alphard-h2-anh20-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2014,
        "yearRangeText": "2008 - 2014",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-239-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-estima-2-4l-hybrid",
        "modelName": "ESTIMA 2.4L Hybrid",
        "engineId": "e-toyota-estima-2-4l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2015,
        "yearRangeText": "2007 - 2015",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-239-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vellfire-h2-2-4l-3-5l",
        "modelName": "VELLFIRE (H2) 2.4L 3.5L",
        "engineId": "e-toyota-vellfire-h2-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2014,
        "yearRangeText": "2008 - 2014",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-240",
    "sku": "P83 047N",
    "name": "Brembo Pad NAO P83 047N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-58010",
      "GDB3456",
      "DB1914"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1200,
    "supplierListPrice": 1200,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-240",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-240-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-alphard-h2-anh20-2-4l-3-5l",
        "modelName": "ALPHARD (H2) ANH20 2.4L 3.5L",
        "engineId": "e-toyota-alphard-h2-anh20-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2014,
        "yearRangeText": "2008 - 2014",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-240-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-estima-2-4l-hybrid",
        "modelName": "ESTIMA 2.4L Hybrid",
        "engineId": "e-toyota-estima-2-4l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2015,
        "yearRangeText": "2007 - 2015",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-240-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vellfire-h2-2-4l-3-5l",
        "modelName": "VELLFIRE (H2) 2.4L 3.5L",
        "engineId": "e-toyota-vellfire-h2-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2014,
        "yearRangeText": "2008 - 2014",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-241",
    "sku": "P83 166N",
    "name": "Brembo Pad NAO P83 166N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-58022",
      "GDB4459"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1150,
    "supplierListPrice": 1150,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-241",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-241-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-alphard-h3-ah30-2-4l-3-5l",
        "modelName": "ALPHARD (H3) AH30 2.4L 3.5L",
        "engineId": "e-toyota-alphard-h3-ah30-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-241-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-alphard-ah30-vellfire-ggh30-3-5",
        "modelName": "ALPHARD AH30 / VELLFIRE GGH30 3.5",
        "engineId": "e-toyota-alphard-ah30-vellfire-ggh30-3-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-241-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vellfire-h3-2-4l-3-5l",
        "modelName": "VELLFIRE (H3) 2.4L 3.5L",
        "engineId": "e-toyota-vellfire-h3-2-4l-3-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-241-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-nx-200t-300-300h",
        "modelName": "NX 200t/300/300h",
        "engineId": "e-lexus-nx-200t-300-300h",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-242",
    "sku": "P83 145B",
    "name": "Brembo Pad Low-M P83 145B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0E010",
      "GDB3484",
      "DB2004"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1550,
    "supplierListPrice": 1550,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-242",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-242-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-alphard-ah30-vellfire-ggh30-3-5",
        "modelName": "ALPHARD AH30 / VELLFIRE GGH30 3.5",
        "engineId": "e-toyota-alphard-ah30-vellfire-ggh30-3-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-242-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx270-300-350-450-agl10-2-7-3-5-4-5",
        "modelName": "RX270/300/350/450 (AGL10) 2.7 3.5 4.5",
        "engineId": "e-lexus-rx270-300-350-450-agl10-2-7-3-5-4-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2014,
        "yearRangeText": "2009 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-242-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx-200t-300-350-450h",
        "modelName": "RX 200t/300/350/450h",
        "engineId": "e-lexus-rx-200t-300-350-450h",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-242-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-nx-200t-300-300h",
        "modelName": "NX 200t/300/300h",
        "engineId": "e-lexus-nx-200t-300-300h",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-243",
    "sku": "P83 145N",
    "name": "Brembo Pad NAO P83 145N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0E010",
      "GDB3484",
      "DB2004"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1500,
    "supplierListPrice": 1500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-243",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-243-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-alphard-ah30-vellfire-ggh30-3-5",
        "modelName": "ALPHARD AH30 / VELLFIRE GGH30 3.5",
        "engineId": "e-toyota-alphard-ah30-vellfire-ggh30-3-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-243-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx270-300-350-450-agl10-2-7-3-5-4-5",
        "modelName": "RX270/300/350/450 (AGL10) 2.7 3.5 4.5",
        "engineId": "e-lexus-rx270-300-350-450-agl10-2-7-3-5-4-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2014,
        "yearRangeText": "2009 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-243-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx-200t-300-350-450h",
        "modelName": "RX 200t/300/350/450h",
        "engineId": "e-lexus-rx-200t-300-350-450h",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-243-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-nx-200t-300-300h",
        "modelName": "NX 200t/300/300h",
        "engineId": "e-lexus-nx-200t-300-300h",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearRangeText": "2014 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-244",
    "sku": "P83 027B",
    "name": "Brembo Pad Low-M P83 027B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04491-50011",
      "GDB1142",
      "DB1209"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1300,
    "supplierListPrice": 1300,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-244",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-244-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-altezza-e1-2-0-gxe10-vvti",
        "modelName": "ALTEZZA E1 2.0 GXE10 VVTi",
        "engineId": "e-toyota-altezza-e1-2-0-gxe10-vvti",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2005,
        "yearRangeText": "1997 - 2005",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-244-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-celica-st202-2-0",
        "modelName": "CELICA ST202 2.0",
        "engineId": "e-toyota-celica-st202-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1999,
        "yearRangeText": "1993 - 1999",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-244-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-es300-ls400-ucf-10-sc-coupe",
        "modelName": "ES300 / LS400 (UCF 10) / SC-Coupe",
        "engineId": "e-lexus-es300-ls400-ucf-10-sc-coupe",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1991,
        "yearTo": 2001,
        "yearRangeText": "1991 - 2001",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-245",
    "sku": "P83 027N",
    "name": "Brembo Pad NAO P83 027N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04491-50011",
      "GDB1142",
      "DB1209"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1350,
    "supplierListPrice": 1350,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-245",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-245-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-altezza-e1-2-0-gxe10-vvti",
        "modelName": "ALTEZZA E1 2.0 GXE10 VVTi",
        "engineId": "e-toyota-altezza-e1-2-0-gxe10-vvti",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2005,
        "yearRangeText": "1997 - 2005",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-245-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-celica-st202-2-0",
        "modelName": "CELICA ST202 2.0",
        "engineId": "e-toyota-celica-st202-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1999,
        "yearRangeText": "1993 - 1999",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-245-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-es300-ls400-ucf-10-sc-coupe",
        "modelName": "ES300 / LS400 (UCF 10) / SC-Coupe",
        "engineId": "e-lexus-es300-ls400-ucf-10-sc-coupe",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1991,
        "yearTo": 2001,
        "yearRangeText": "1991 - 2001",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-246",
    "sku": "P83 037N",
    "name": "Brembo Pad NAO P83 037N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-14080",
      "GDB3235",
      "DB1395"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1660,
    "supplierListPrice": 1660,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-246",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-246-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-altezza-gita-estate-xe1-2-0",
        "modelName": "ALTEZZA GITA Estate (XE1) 2.0",
        "engineId": "e-toyota-altezza-gita-estate-xe1-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1991,
        "yearRangeText": "1991 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-246-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-crown-estate-2-5l",
        "modelName": "CROWN ESTATE 2.5L",
        "engineId": "e-toyota-crown-estate-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1999,
        "yearTo": 2003,
        "yearRangeText": "1999 - 2003",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-246-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-gs300-jzs160-3-0l",
        "modelName": "GS300 (JZS160) 3.0L",
        "engineId": "e-lexus-gs300-jzs160-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2005,
        "yearRangeText": "2000 - 2005",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-246-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-is200-gxe10-2-0l",
        "modelName": "IS200 (GXE10) 2.0L",
        "engineId": "e-lexus-is200-gxe10-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1999,
        "yearTo": 2003,
        "yearRangeText": "1999 - 2003",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-246-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-sc430-uzz40-4-3l",
        "modelName": "SC430 (UZZ40) 4.3L",
        "engineId": "e-lexus-sc430-uzz40-4-3l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2005,
        "yearRangeText": "2000 - 2005",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-247",
    "sku": "P83 045N",
    "name": "Brembo Pad NAO P83 045N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-30120",
      "GDB3233",
      "DB1416"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1230,
    "supplierListPrice": 1230,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-247",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-247-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-altezza-e1-gita-estate-xe1-2-0",
        "modelName": "ALTEZZA E1 / GITA Estate (XE1) 2.0",
        "engineId": "e-toyota-altezza-e1-gita-estate-xe1-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1991,
        "yearRangeText": "1991 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-247-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-crown-estate-2-5l",
        "modelName": "CROWN ESTATE 2.5L",
        "engineId": "e-toyota-crown-estate-2-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1999,
        "yearTo": 2003,
        "yearRangeText": "1999 - 2003",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-247-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-gs300-jzs160-3-0l",
        "modelName": "GS300 (JZS160) 3.0L",
        "engineId": "e-lexus-gs300-jzs160-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2005,
        "yearRangeText": "2000 - 2005",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-247-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-is200-gxe10-2-0l",
        "modelName": "IS200 (GXE10) 2.0L",
        "engineId": "e-lexus-is200-gxe10-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1999,
        "yearTo": 2003,
        "yearRangeText": "1999 - 2003",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-247-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-sc430-uzz40-4-3l",
        "modelName": "SC430 (UZZ40) 4.3L",
        "engineId": "e-lexus-sc430-uzz40-4-3l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2005,
        "yearRangeText": "2000 - 2005",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-248",
    "sku": "P83 034N",
    "name": "Brembo Pad NAO P83 034N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0446533050 / 0449112651",
      "GDB1143"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1470,
    "supplierListPrice": 1470,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-248",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-248-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-sxv10-svx20-2-2l",
        "modelName": "CAMRY SXV10 SVX20 2.2L",
        "engineId": "e-toyota-camry-sxv10-svx20-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1997,
        "yearRangeText": "1993 - 1997",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-248-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corona-at191-st191-excior-st-1-6l-2-0l",
        "modelName": "CORONA (AT191, ST191) EXCIOR ST 1.6L 2.0L",
        "engineId": "e-toyota-corona-at191-st191-excior-st-1-6l-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1997,
        "yearRangeText": "1993 - 1997",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-248-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-rav4-i-a1-2-0l-2wd-4wd",
        "modelName": "RAV4 I (A1) 2.0L 2WD/4WD",
        "engineId": "e-toyota-rav4-i-a1-2-0l-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1994,
        "yearTo": 2000,
        "yearRangeText": "1994 - 2000",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-249",
    "sku": "P83 015N",
    "name": "Brembo Pad NAO P83 015N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0449220060",
      "GDB1168",
      "04492-20060",
      "DB1147"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1040,
    "supplierListPrice": 1040,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-249",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-249-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-sxv10-svx20-2-2l",
        "modelName": "CAMRY SXV10 SVX20 2.2L",
        "engineId": "e-toyota-camry-sxv10-svx20-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1997,
        "yearRangeText": "1993 - 1997",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-249-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e110-1-6l-1-8l",
        "modelName": "COROLLA (E110) 1.6L 1.8L",
        "engineId": "e-toyota-corolla-e110-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1996,
        "yearTo": 2001,
        "yearRangeText": "1996 - 2001",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-249-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corona-at191-st191-excior-st-1-6l-2-0l",
        "modelName": "CORONA (AT191, ST191) EXCIOR ST 1.6L 2.0L",
        "engineId": "e-toyota-corona-at191-st191-excior-st-1-6l-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1997,
        "yearRangeText": "1993 - 1997",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-249-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-harrier-xu10-2-2l",
        "modelName": "HARRIER XU10 2.2L",
        "engineId": "e-toyota-harrier-xu10-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2003,
        "yearRangeText": "1998 - 2003",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-249-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-harrier-xu10-3-0l",
        "modelName": "HARRIER XU10 3.0L",
        "engineId": "e-toyota-harrier-xu10-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2003,
        "yearRangeText": "1998 - 2003",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-249-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-es300-xv20-2-0l-2-2l-3-0l-1mz",
        "modelName": "ES300 (XV20) 2.0L 2.2L 3.0L (ปั๊ม 1MZ)",
        "engineId": "e-lexus-es300-xv20-2-0l-2-2l-3-0l-1mz",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2002,
        "yearRangeText": "1997 - 2002",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-250",
    "sku": "P83 040B",
    "name": "Brembo Pad Low-M P83 040B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0446520550",
      "GDB3152",
      "04465-20550",
      "DB1345"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1300,
    "supplierListPrice": 1300,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-250",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-250-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-sxv20-2-2l",
        "modelName": "CAMRY SXV20 2.2L",
        "engineId": "e-toyota-camry-sxv20-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2002,
        "yearRangeText": "1998 - 2002",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-250-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-harrier-xu10-2-2l",
        "modelName": "HARRIER XU10 2.2L",
        "engineId": "e-toyota-harrier-xu10-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2003,
        "yearRangeText": "1998 - 2003",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-250-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-es300-xv20-2-0l-2-2l-3-0l-1mz",
        "modelName": "ES300 (XV20) 2.0L 2.2L 3.0L (ปั๊ม 1MZ)",
        "engineId": "e-lexus-es300-xv20-2-0l-2-2l-3-0l-1mz",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2002,
        "yearRangeText": "1997 - 2002",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-251",
    "sku": "P83 040N",
    "name": "Brembo Pad NAO P83 040N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0446520550",
      "GDB3152",
      "04465-20550",
      "DB1345"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1320,
    "supplierListPrice": 1320,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-251",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-251-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-sxv20-2-2l",
        "modelName": "CAMRY SXV20 2.2L",
        "engineId": "e-toyota-camry-sxv20-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2002,
        "yearRangeText": "1998 - 2002",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-251-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-harrier-xu10-2-2l",
        "modelName": "HARRIER XU10 2.2L",
        "engineId": "e-toyota-harrier-xu10-2-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2003,
        "yearRangeText": "1998 - 2003",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-251-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-es300-xv20-2-0l-2-2l-3-0l-1mz",
        "modelName": "ES300 (XV20) 2.0L 2.2L 3.0L (ปั๊ม 1MZ)",
        "engineId": "e-lexus-es300-xv20-2-0l-2-2l-3-0l-1mz",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2002,
        "yearRangeText": "1997 - 2002",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-252",
    "sku": "P83 088N",
    "name": "Brembo Pad NAO P83 088N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-33100",
      "GDB7628",
      "DB1463"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 850,
    "supplierListPrice": 850,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-252",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-252-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-acv30-2-0-2-4",
        "modelName": "CAMRY ACV30 2.0 2.4",
        "engineId": "e-toyota-camry-acv30-2-0-2-4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2006,
        "yearRangeText": "2002 - 2006",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-252-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-wish-g-q-s-2-0l",
        "modelName": "WISH G/Q/S 2.0L",
        "engineId": "e-toyota-wish-g-q-s-2-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2010,
        "yearRangeText": "2004 - 2010",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-252-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-es300-xv30-3-0l-vvti-24v",
        "modelName": "ES300 (XV30) 3.0L VVTi 24V",
        "engineId": "e-lexus-es300-xv30-3-0l-vvti-24v",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2006,
        "yearRangeText": "2002 - 2006",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-253",
    "sku": "P83 117B",
    "name": "Brembo Pad Low-M P83 117B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-06090",
      "GDB3429",
      "DB1800H"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1550,
    "supplierListPrice": 1550,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-253",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-253-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-acv40-2-0-2-4",
        "modelName": "CAMRY ACV40 2.0 2.4",
        "engineId": "e-toyota-camry-acv40-2-0-2-4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2012,
        "yearRangeText": "2006 - 2012",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-253-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-acv50-2-0-2-5",
        "modelName": "CAMRY ACV50 2.0 2.5",
        "engineId": "e-toyota-camry-acv50-2-0-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2018,
        "yearRangeText": "2012 - 2018",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-254",
    "sku": "P83 117N",
    "name": "Brembo Pad NAO P83 117N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-06090",
      "GDB3429",
      "DB1800H"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1700,
    "supplierListPrice": 1700,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-254",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-254-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-acv40-2-0-2-4",
        "modelName": "CAMRY ACV40 2.0 2.4",
        "engineId": "e-toyota-camry-acv40-2-0-2-4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2012,
        "yearRangeText": "2006 - 2012",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-254-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-acv50-2-0-2-5",
        "modelName": "CAMRY ACV50 2.0 2.5",
        "engineId": "e-toyota-camry-acv50-2-0-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2018,
        "yearRangeText": "2012 - 2018",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-255",
    "sku": "P83 089N",
    "name": "Brembo Pad NAO P83 089N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-42060",
      "GDB3426",
      "DB1832"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 920,
    "supplierListPrice": 920,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-255",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-255-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-acv40-2-0-2-4",
        "modelName": "CAMRY ACV40 2.0 2.4",
        "engineId": "e-toyota-camry-acv40-2-0-2-4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2012,
        "yearRangeText": "2006 - 2012",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-255-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-acv50-2-0-2-5",
        "modelName": "CAMRY ACV50 2.0 2.5",
        "engineId": "e-toyota-camry-acv50-2-0-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearTo": 2018,
        "yearRangeText": "2012 - 2018",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-255-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-cross-1-8l",
        "modelName": "COROLLA CROSS 1.8L",
        "engineId": "e-toyota-corolla-cross-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-255-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-harrier-xu60-2-0l-2-5l-hybrid",
        "modelName": "HARRIER XU60 2.0L 2.5L Hybrid",
        "engineId": "e-toyota-harrier-xu60-2-0l-2-5l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2020,
        "yearRangeText": "2013 - 2020",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-255-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-rav4-iii-a3-2-0l-2wd-4wd",
        "modelName": "RAV4 III (A3) 2.0L 2WD/4WD",
        "engineId": "e-toyota-rav4-iii-a3-2-0l-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearRangeText": "2008 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-256",
    "sku": "P83 172N",
    "name": "Brembo Pad NAO P83 172N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0446506150 / 0446533480",
      "GDB8160",
      "044650E060"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1800,
    "supplierListPrice": 1800,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-256",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-256-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-acv70-2-0-2-5",
        "modelName": "CAMRY ACV70 2.0 2.5",
        "engineId": "e-toyota-camry-acv70-2-0-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-256-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-c-hr-hybrid-premium-safety-1-8l-abs",
        "modelName": "C-HR Hybrid Premium Safety 1.8L ABS",
        "engineId": "e-toyota-c-hr-hybrid-premium-safety-1-8l-abs",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2021,
        "yearRangeText": "2021 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-256-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-cross-1-8l",
        "modelName": "COROLLA CROSS 1.8L",
        "engineId": "e-toyota-corolla-cross-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-256-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ux-es-asz10-18",
        "modelName": "UX ES (ASZ10) (ปี18)",
        "engineId": "e-lexus-ux-es-asz10-18",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearTo": 2018,
        "yearRangeText": "2018",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-257",
    "sku": "P83 160B",
    "name": "Brembo Pad Low-M P83 160B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-10010",
      "GDB8161",
      "GDB8968",
      "GDB2183"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1300,
    "supplierListPrice": 1300,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-257",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-257-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-acv70-2-0-2-5",
        "modelName": "CAMRY ACV70 2.0 2.5",
        "engineId": "e-toyota-camry-acv70-2-0-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-257-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-c-hr-entry-mid-hvmid-hvhi-1-8l-abs",
        "modelName": "C-HR Entry/Mid/HVMid/HVHi 1.8L ABS",
        "engineId": "e-toyota-c-hr-entry-mid-hvmid-hvhi-1-8l-abs",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearTo": 2021,
        "yearRangeText": "2018 - 2021",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-257-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-c-hr-hybrid-premium-safety-1-8l-abs",
        "modelName": "C-HR Hybrid Premium Safety 1.8L ABS",
        "engineId": "e-toyota-c-hr-hybrid-premium-safety-1-8l-abs",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2021,
        "yearRangeText": "2021 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-257-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx-200t-300-350-450h",
        "modelName": "RX 200t/300/350/450h",
        "engineId": "e-lexus-rx-200t-300-350-450h",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-257-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ux-200-250h-e-four",
        "modelName": "UX 200/250h E-FOUR",
        "engineId": "e-lexus-ux-200-250h-e-four",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-257-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ux-es-asz10-18",
        "modelName": "UX ES (ASZ10) (ปี18)",
        "engineId": "e-lexus-ux-es-asz10-18",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearTo": 2018,
        "yearRangeText": "2018",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-258",
    "sku": "P83 160N",
    "name": "Brembo Pad NAO P83 160N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-10010",
      "GDB8161",
      "GDB8968",
      "GDB2183"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1260,
    "supplierListPrice": 1260,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-258",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-258-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-camry-acv70-2-0-2-5",
        "modelName": "CAMRY ACV70 2.0 2.5",
        "engineId": "e-toyota-camry-acv70-2-0-2-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-258-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-c-hr-entry-mid-hvmid-hvhi-1-8l-abs",
        "modelName": "C-HR Entry/Mid/HVMid/HVHi 1.8L ABS",
        "engineId": "e-toyota-c-hr-entry-mid-hvmid-hvhi-1-8l-abs",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearTo": 2021,
        "yearRangeText": "2018 - 2021",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-258-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-c-hr-hybrid-premium-safety-1-8l-abs",
        "modelName": "C-HR Hybrid Premium Safety 1.8L ABS",
        "engineId": "e-toyota-c-hr-hybrid-premium-safety-1-8l-abs",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2021,
        "yearRangeText": "2021 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-258-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx-200t-300-350-450h",
        "modelName": "RX 200t/300/350/450h",
        "engineId": "e-lexus-rx-200t-300-350-450h",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearRangeText": "2015 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-258-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ux-200-250h-e-four",
        "modelName": "UX 200/250h E-FOUR",
        "engineId": "e-lexus-ux-200-250h-e-four",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearRangeText": "2018 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-258-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ux-es-asz10-18",
        "modelName": "UX ES (ASZ10) (ปี18)",
        "engineId": "e-lexus-ux-es-asz10-18",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearTo": 2018,
        "yearRangeText": "2018",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-259",
    "sku": "P83 171B",
    "name": "Brembo Pad Low-M P83 171B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-F4010",
      "GDB8964",
      "DB2479"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-259",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-259-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-c-hr-entry-mid-hvmid-hvhi-1-8l-abs",
        "modelName": "C-HR Entry/Mid/HVMid/HVHi 1.8L ABS",
        "engineId": "e-toyota-c-hr-entry-mid-hvmid-hvhi-1-8l-abs",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearTo": 2021,
        "yearRangeText": "2018 - 2021",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-260",
    "sku": "P83 171N",
    "name": "Brembo Pad NAO P83 171N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-F4010",
      "GDB8964",
      "DB2479"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2160,
    "supplierListPrice": 2160,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-260",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-260-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-c-hr-entry-mid-hvmid-hvhi-1-8l-abs",
        "modelName": "C-HR Entry/Mid/HVMid/HVHi 1.8L ABS",
        "engineId": "e-toyota-c-hr-entry-mid-hvmid-hvhi-1-8l-abs",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2018,
        "yearTo": 2021,
        "yearRangeText": "2018 - 2021",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-261",
    "sku": "P83 011N",
    "name": "Brembo Pad NAO P83 011N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04491-12170",
      "GDB323",
      "DB308"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 850,
    "supplierListPrice": 850,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-261",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-261-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e80-1-3l-1-6l",
        "modelName": "COROLLA (E80) 1.3L 1.6L",
        "engineId": "e-toyota-corolla-e80-1-3l-1-6l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1984,
        "yearTo": 1988,
        "yearRangeText": "1984 - 1988",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-261-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e90-1-3l-1-5l-1-6l",
        "modelName": "COROLLA (E90) 1.3L 1.5L 1.6L",
        "engineId": "e-toyota-corolla-e90-1-3l-1-5l-1-6l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1988,
        "yearTo": 1992,
        "yearRangeText": "1988 - 1992",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-261-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e100-1-3l-1-5l-1-6l",
        "modelName": "COROLLA (E100) 1.3L 1.5L 1.6L",
        "engineId": "e-toyota-corolla-e100-1-3l-1-5l-1-6l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1992,
        "yearTo": 1996,
        "yearRangeText": "1992 - 1996",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-261-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e110-1-6l-1-8l",
        "modelName": "COROLLA (E110) 1.6L 1.8L",
        "engineId": "e-toyota-corolla-e110-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1996,
        "yearTo": 2001,
        "yearRangeText": "1996 - 2001",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-261-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corona-at171-1-6l",
        "modelName": "CORONA (AT171) 1.6L",
        "engineId": "e-toyota-corona-at171-1-6l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1988,
        "yearTo": 1992,
        "yearRangeText": "1988 - 1992",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-261-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-soluna-1-3l-1-5l",
        "modelName": "SOLUNA 1.3L 1.5L",
        "engineId": "e-toyota-soluna-1-3l-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2002,
        "yearRangeText": "1997 - 2002",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-262",
    "sku": "P83 051N",
    "name": "Brembo Pad NAO P83 051N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-52010",
      "GDB3242",
      "DB1422"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 730,
    "supplierListPrice": 730,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-262",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-262-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e120-e130-altis-1-6l-1-8l",
        "modelName": "COROLLA (E120, E130) ALTIS 1.6L 1.8L",
        "engineId": "e-toyota-corolla-e120-e130-altis-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearTo": 2007,
        "yearRangeText": "2001 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-262-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e120-e130-altis-limo-1-6l-1-8l",
        "modelName": "COROLLA (E120, E130) ALTIS LIMO 1.6L 1.8L",
        "engineId": "e-toyota-corolla-e120-e130-altis-limo-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearTo": 2007,
        "yearRangeText": "2001 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-262-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vios-ncp40-j-1-5l",
        "modelName": "VIOS (NCP40) J 1.5L",
        "engineId": "e-toyota-vios-ncp40-j-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-262-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vios-ncp40-e-s-1-5l",
        "modelName": "VIOS (NCP40) E/S 1.5L",
        "engineId": "e-toyota-vios-ncp40-e-s-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-263",
    "sku": "P83 052B",
    "name": "Brembo Pad Low-M P83 052B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-52010",
      "GDB3243",
      "DB1429"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 750,
    "supplierListPrice": 750,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-263",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-263-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e120-e130-altis-1-6l-1-8l",
        "modelName": "COROLLA (E120, E130) ALTIS 1.6L 1.8L",
        "engineId": "e-toyota-corolla-e120-e130-altis-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearTo": 2007,
        "yearRangeText": "2001 - 2007",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-263-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vios-ncp40-e-s-1-5l",
        "modelName": "VIOS (NCP40) E/S 1.5L",
        "engineId": "e-toyota-vios-ncp40-e-s-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-264",
    "sku": "P83 052N",
    "name": "Brembo Pad NAO P83 052N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-52010",
      "GDB3243",
      "DB1429"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 810,
    "supplierListPrice": 810,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-264",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-264-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e120-e130-altis-1-6l-1-8l",
        "modelName": "COROLLA (E120, E130) ALTIS 1.6L 1.8L",
        "engineId": "e-toyota-corolla-e120-e130-altis-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearTo": 2007,
        "yearRangeText": "2001 - 2007",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-264-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vios-ncp40-e-s-1-5l",
        "modelName": "VIOS (NCP40) E/S 1.5L",
        "engineId": "e-toyota-vios-ncp40-e-s-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-265",
    "sku": "P83 082N",
    "name": "Brembo Pad NAO P83 082N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-42160",
      "GDB3425",
      "DB1802"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1280,
    "supplierListPrice": 1280,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-265",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-265-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e140-e150-altis-1-6l-1-8l",
        "modelName": "COROLLA (E140, E150) ALTIS 1.6L 1.8L",
        "engineId": "e-toyota-corolla-e140-e150-altis-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2013,
        "yearRangeText": "2008 - 2013",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-265-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e170-e180-altis-1-6l-1-8l",
        "modelName": "COROLLA (E170, E180) ALTIS 1.6L 1.8L",
        "engineId": "e-toyota-corolla-e170-e180-altis-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2019,
        "yearRangeText": "2014 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-265-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e210-altis-1-6l",
        "modelName": "COROLLA (E210) ALTIS 1.6L",
        "engineId": "e-toyota-corolla-e210-altis-1-6l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-265-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-sienta-1-5l",
        "modelName": "SIENTA 1.5L",
        "engineId": "e-toyota-sienta-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearRangeText": "2016 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-266",
    "sku": "P83 133N",
    "name": "Brembo Pad NAO P83 133N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04464-47030",
      "GDB7729",
      "DB1786"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 850,
    "supplierListPrice": 850,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-266",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-266-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-corolla-e170-e180-altis-1-6l-1-8l",
        "modelName": "COROLLA (E170, E180) ALTIS 1.6L 1.8L",
        "engineId": "e-toyota-corolla-e170-e180-altis-1-6l-1-8l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2019,
        "yearRangeText": "2014 - 2019",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-266-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-prius-1-8-hybrid",
        "modelName": "PRIUS 1.8 Hybrid",
        "engineId": "e-toyota-prius-1-8-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2014,
        "yearRangeText": "2009 - 2014",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-266-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vios-g-s-1-5l",
        "modelName": "VIOS G/S 1.5L",
        "engineId": "e-toyota-vios-g-s-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2016,
        "yearRangeText": "2013 - 2016",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-266-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vios-g-s-mid-high-1-5l",
        "modelName": "VIOS G/S/Mid/High 1.5L",
        "engineId": "e-toyota-vios-g-s-mid-high-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-266-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-yaris-s-rs-1-5l",
        "modelName": "YARIS S/RS 1.5L",
        "engineId": "e-toyota-yaris-s-rs-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2012,
        "yearRangeText": "2006 - 2012",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-266-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ct200h-1-8l-hybrid",
        "modelName": "CT200h 1.8L Hybrid",
        "engineId": "e-lexus-ct200h-1-8l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2016,
        "yearRangeText": "2010 - 2016",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-267",
    "sku": "P83 100N",
    "name": "Brembo Pad NAO P83 100N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0446528430"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1790,
    "supplierListPrice": 1790,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-267",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-267-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-estima-lucida-2-4l-3-0l",
        "modelName": "ESTIMA / LUCIDA 2.4L 3.0L",
        "engineId": "e-toyota-estima-lucida-2-4l-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2007,
        "yearRangeText": "2002 - 2007",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-268",
    "sku": "P83 069B",
    "name": "Brembo Pad Low-M P83 069B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0K020",
      "GDB3428",
      "DB1739"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 950,
    "supplierListPrice": 950,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-268",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-268-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-fortuner-4x4-2-7l-3-0d",
        "modelName": "FORTUNER 4x4 2.7L 3.0D",
        "engineId": "e-toyota-fortuner-4x4-2-7l-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2008,
        "yearRangeText": "2005 - 2008",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-268-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-vigo-open-cab-2-5d-3-0d",
        "modelName": "HILUX VIGO (Open cab) 2.5D 3.0D ตัวสูง",
        "engineId": "e-toyota-hilux-vigo-open-cab-2-5d-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-269",
    "sku": "P83 069N",
    "name": "Brembo Pad NAO P83 069N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0K020",
      "GDB3428",
      "DB1739"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 990,
    "supplierListPrice": 990,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-269",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-269-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-fortuner-4x4-2-7l-3-0d",
        "modelName": "FORTUNER 4x4 2.7L 3.0D",
        "engineId": "e-toyota-fortuner-4x4-2-7l-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2008,
        "yearRangeText": "2005 - 2008",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-269-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-vigo-open-cab-2-5d-3-0d",
        "modelName": "HILUX VIGO (Open cab) 2.5D 3.0D ตัวสูง",
        "engineId": "e-toyota-hilux-vigo-open-cab-2-5d-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-270",
    "sku": "P83 102N",
    "name": "Brembo Pad NAO P83 102N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "044650K580",
      "GDB3364",
      "04465-0K090",
      "DB1482",
      "GDB8998",
      "044650K390"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1150,
    "supplierListPrice": 1150,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-270",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-270-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-fortuner-smart-champ-2-5d-2-7l-3-0d",
        "modelName": "FORTUNER SMART/CHAMP 2.5D 2.7L 3.0D",
        "engineId": "e-toyota-fortuner-smart-champ-2-5d-2-7l-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2015,
        "yearRangeText": "2008 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-270-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-fortuner-smart-champ-trd-2-8d-3-0d",
        "modelName": "FORTUNER SMART/CHAMP TRD 2.8D 3.0D",
        "engineId": "e-toyota-fortuner-smart-champ-trd-2-8d-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2015,
        "yearRangeText": "2008 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-270-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-fortuner-2-4d-2-7l-2-8d",
        "modelName": "FORTUNER 2.4D 2.7L 2.8D",
        "engineId": "e-toyota-fortuner-2-4d-2-7l-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2017,
        "yearRangeText": "2015 - 2017",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-270-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-fortuner-2-4d-2-7l-2-8d",
        "modelName": "FORTUNER 2.4D 2.7L 2.8D",
        "engineId": "e-toyota-fortuner-2-4d-2-7l-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-270-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-vigo-smart-cab-double-cab-2-7l",
        "modelName": "HILUX VIGO (Smart cab/Double Cab) 2.7L ตัวสูง",
        "engineId": "e-toyota-hilux-vigo-smart-cab-double-cab-2-7l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2011,
        "yearRangeText": "2008 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-270-5",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-revo-2-4d-2-8d",
        "modelName": "HILUX REVO 2.4D 2.8D ตัวสูง",
        "engineId": "e-toyota-hilux-revo-2-4d-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2019,
        "yearRangeText": "2015 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-270-6",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-revo-2-4d-2-8d",
        "modelName": "HILUX REVO 2.4D 2.8D ตัวสูง",
        "engineId": "e-toyota-hilux-revo-2-4d-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-270-7",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-land-cruiser-j12-prado-2-7l-3-0d-3-4d-4-0d-4wd",
        "modelName": "LAND CRUISER (J12) PRADO 2.7L 3.0D 3.4D 4.0D 4WD",
        "engineId": "e-toyota-land-cruiser-j12-prado-2-7l-3-0d-3-4d-4-0d-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2009,
        "yearRangeText": "2002 - 2009",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-270-8",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-lx-urj201-2",
        "modelName": "LX URJ201-2",
        "engineId": "e-lexus-lx-urj201-2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2012,
        "yearRangeText": "2012 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-271",
    "sku": "P83 024N",
    "name": "Brembo Pad NAO P83 024N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-60010",
      "GDB1182",
      "DB1200"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 850,
    "supplierListPrice": 850,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-271",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-271-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-fortuner-smart-champ-trd-2-8d-3-0d",
        "modelName": "FORTUNER SMART/CHAMP TRD 2.8D 3.0D",
        "engineId": "e-toyota-fortuner-smart-champ-trd-2-8d-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2015,
        "yearRangeText": "2008 - 2015",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-271-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-land-cruiser-hzj80-vx80-4-2l-4-5l-4wd",
        "modelName": "LAND CRUISER (HZJ80) VX80 4.2L 4.5L 4WD",
        "engineId": "e-toyota-land-cruiser-hzj80-vx80-4-2l-4-5l-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1990,
        "yearTo": 1998,
        "yearRangeText": "1990 - 1998",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-271-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-land-cruiser-j12-prado-2-7l-3-0d-3-4d-4-0d-4wd",
        "modelName": "LAND CRUISER (J12) PRADO 2.7L 3.0D 3.4D 4.0D 4WD",
        "engineId": "e-toyota-land-cruiser-j12-prado-2-7l-3-0d-3-4d-4-0d-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2002,
        "yearTo": 2009,
        "yearRangeText": "2002 - 2009",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-271-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx270-300-350-450-mcu15-3-0l-4x4",
        "modelName": "RX270/300/350/450 (MCU15) 3.0L 4x4",
        "engineId": "e-lexus-rx270-300-350-450-mcu15-3-0l-4x4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2003,
        "yearRangeText": "2000 - 2003",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-272",
    "sku": "P83 152N",
    "name": "Brembo Pad NAO P83 152N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-0K010",
      "GDB8979",
      "GDB4174",
      "DB2245"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1200,
    "supplierListPrice": 1200,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-272",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-272-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-fortuner-2-4d-2-7l-2-8d",
        "modelName": "FORTUNER 2.4D 2.7L 2.8D",
        "engineId": "e-toyota-fortuner-2-4d-2-7l-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-272-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-sienta-1-5l",
        "modelName": "SIENTA 1.5L",
        "engineId": "e-toyota-sienta-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearRangeText": "2016 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-272-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx270-300-350-450-agl10-2-7-3-5-4-5",
        "modelName": "RX270/300/350/450 (AGL10) 2.7 3.5 4.5",
        "engineId": "e-lexus-rx270-300-350-450-agl10-2-7-3-5-4-5",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2014,
        "yearRangeText": "2009 - 2014",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-273",
    "sku": "P56 050N",
    "name": "Brembo Pad NAO P56 050N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-48040",
      "GDB3379",
      "DB1494"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1800,
    "supplierListPrice": 1800,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-273",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-273-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-harrier-xu10-3-0l",
        "modelName": "HARRIER XU10 3.0L",
        "engineId": "e-toyota-harrier-xu10-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2003,
        "yearRangeText": "1998 - 2003",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-273-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx270-300-350-450-mcu15-3-0l-4x4",
        "modelName": "RX270/300/350/450 (MCU15) 3.0L 4x4",
        "engineId": "e-lexus-rx270-300-350-450-mcu15-3-0l-4x4",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2003,
        "yearRangeText": "2000 - 2003",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-273-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx300",
        "modelName": "RX300",
        "engineId": "e-lexus-rx300",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2003,
        "yearRangeText": "1998 - 2003",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-274",
    "sku": "P83 050N",
    "name": "Brembo Pad NAO P83 050N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0446552280",
      "GDB3379"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1650,
    "supplierListPrice": 1650,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-274",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-274-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-harrier-xu10-3-0l",
        "modelName": "HARRIER XU10 3.0L",
        "engineId": "e-toyota-harrier-xu10-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2003,
        "yearRangeText": "1998 - 2003",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-275",
    "sku": "P83 067N",
    "name": "Brembo Pad NAO P83 067N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-48080",
      "GDB3338",
      "DB1517"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2080,
    "supplierListPrice": 2080,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-275",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-275-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-harrier-xu30-3-0l",
        "modelName": "HARRIER XU30 3.0L",
        "engineId": "e-toyota-harrier-xu30-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2013,
        "yearRangeText": "2003 - 2013",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-275-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx270-300-350-450-u3-3-0l-4x2",
        "modelName": "RX270/300/350/450 (U3) 3.0L 4x2",
        "engineId": "e-lexus-rx270-300-350-450-u3-3-0l-4x2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2008,
        "yearRangeText": "2003 - 2008",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-276",
    "sku": "P83 068N",
    "name": "Brembo Pad NAO P83 068N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-48040",
      "GDB3339",
      "DB1518"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1140,
    "supplierListPrice": 1140,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-276",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-276-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-harrier-xu30-3-0l",
        "modelName": "HARRIER XU30 3.0L",
        "engineId": "e-toyota-harrier-xu30-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2013,
        "yearRangeText": "2003 - 2013",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-276-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx270-300-350-450-u3-3-0l-4x2",
        "modelName": "RX270/300/350/450 (U3) 3.0L 4x2",
        "engineId": "e-lexus-rx270-300-350-450-u3-3-0l-4x2",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2008,
        "yearRangeText": "2003 - 2008",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-277",
    "sku": "P83 071N",
    "name": "Brembo Pad NAO P83 071N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-42180",
      "GDB3424",
      "DB1801"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1000,
    "supplierListPrice": 1000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-277",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-277-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-harrier-xu60-2-0l-2-5l-hybrid",
        "modelName": "HARRIER XU60 2.0L 2.5L Hybrid",
        "engineId": "e-toyota-harrier-xu60-2-0l-2-5l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2020,
        "yearRangeText": "2013 - 2020",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-277-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-rav4-iii-a3-2-0l-2wd-4wd",
        "modelName": "RAV4 III (A3) 2.0L 2WD/4WD",
        "engineId": "e-toyota-rav4-iii-a3-2-0l-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearRangeText": "2008 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-278",
    "sku": "P83 092B",
    "name": "Brembo Pad Low-M P83 092B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-25040",
      "GDB770",
      "DB1328"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 850,
    "supplierListPrice": 850,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-278",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-278-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hiace-lh100-granvia-3-0l-3-4l",
        "modelName": "HIACE (LH100) GRANVIA 3.0L 3.4L",
        "engineId": "e-toyota-hiace-lh100-granvia-3-0l-3-4l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1995,
        "yearTo": 2002,
        "yearRangeText": "1995 - 2002",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-278-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hiace-lh125-2-5d-2-8d",
        "modelName": "HIACE (LH125) หลังคาสูง 2.5D 2.8D",
        "engineId": "e-toyota-hiace-lh125-2-5d-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2004,
        "yearRangeText": "1997 - 2004",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-279",
    "sku": "P83 092N",
    "name": "Brembo Pad NAO P83 092N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-25040",
      "GDB770",
      "DB1328"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 920,
    "supplierListPrice": 920,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-279",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-279-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hiace-lh100-granvia-3-0l-3-4l",
        "modelName": "HIACE (LH100) GRANVIA 3.0L 3.4L",
        "engineId": "e-toyota-hiace-lh100-granvia-3-0l-3-4l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1995,
        "yearTo": 2002,
        "yearRangeText": "1995 - 2002",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-279-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hiace-lh125-2-5d-2-8d",
        "modelName": "HIACE (LH125) หลังคาสูง 2.5D 2.8D",
        "engineId": "e-toyota-hiace-lh125-2-5d-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1997,
        "yearTo": 2004,
        "yearRangeText": "1997 - 2004",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-280",
    "sku": "P83 139B",
    "name": "Brembo Pad Low-M P83 139B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-26420",
      "GDB7693",
      "DB1772"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 930,
    "supplierListPrice": 930,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-280",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-280-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hiace-kdh222-commuter-2-5d-2-7l-3-0d",
        "modelName": "HIACE (KDH222) COMMUTER 2.5D 2.7L 3.0D",
        "engineId": "e-toyota-hiace-kdh222-commuter-2-5d-2-7l-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2011,
        "yearRangeText": "2005 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-280-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hiace-kdh223-commuter-2-5d-2-7l-3-0d",
        "modelName": "HIACE (KDH223) COMMUTER 2.5D 2.7L 3.0D",
        "engineId": "e-toyota-hiace-kdh223-commuter-2-5d-2-7l-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2014,
        "yearRangeText": "2011 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-280-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hiace-kdh223-commuter-2-5d-2-7l-3-0d",
        "modelName": "HIACE (KDH223) COMMUTER 2.5D 2.7L 3.0D",
        "engineId": "e-toyota-hiace-kdh223-commuter-2-5d-2-7l-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2019,
        "yearRangeText": "2014 - 2019",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-281",
    "sku": "P83 139N",
    "name": "Brembo Pad NAO P83 139N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-26420",
      "GDB7693",
      "DB1772"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1000,
    "supplierListPrice": 1000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-281",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-281-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hiace-kdh222-commuter-2-5d-2-7l-3-0d",
        "modelName": "HIACE (KDH222) COMMUTER 2.5D 2.7L 3.0D",
        "engineId": "e-toyota-hiace-kdh222-commuter-2-5d-2-7l-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2011,
        "yearRangeText": "2005 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-281-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hiace-kdh223-commuter-2-5d-2-7l-3-0d",
        "modelName": "HIACE (KDH223) COMMUTER 2.5D 2.7L 3.0D",
        "engineId": "e-toyota-hiace-kdh223-commuter-2-5d-2-7l-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2014,
        "yearRangeText": "2011 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-281-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hiace-kdh223-commuter-2-5d-2-7l-3-0d",
        "modelName": "HIACE (KDH223) COMMUTER 2.5D 2.7L 3.0D",
        "engineId": "e-toyota-hiace-kdh223-commuter-2-5d-2-7l-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2019,
        "yearRangeText": "2014 - 2019",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-282",
    "sku": "P83 009N",
    "name": "Brembo Pad NAO P83 009N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-35040",
      "GDB797",
      "DB1149"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1000,
    "supplierListPrice": 1000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-282",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-282-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-mighty-x-n80-110-2-5d-2-8d",
        "modelName": "HILUX MIGHTY-X (N80-110) 2.5D 2.8D ตัวสูง",
        "engineId": "e-toyota-hilux-mighty-x-n80-110-2-5d-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1990,
        "yearTo": 1998,
        "yearRangeText": "1990 - 1998",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-282-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-tiger-n140-170-3-0d",
        "modelName": "HILUX TIGER (N140-170) 3.0D ตัวสูง",
        "engineId": "e-toyota-hilux-tiger-n140-170-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2004,
        "yearRangeText": "1998 - 2004",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-282-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-sport-rider-3-0d",
        "modelName": "HILUX SPORT RIDER 3.0D ตัวสูง",
        "engineId": "e-toyota-hilux-sport-rider-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2004,
        "yearRangeText": "1998 - 2004",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-283",
    "sku": "P83 096B",
    "name": "Brembo Pad Low-M P83 096B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0K160",
      "GDB7669",
      "DB1741"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 900,
    "supplierListPrice": 900,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-283",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-283-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-vigo-2-5d-3-0d",
        "modelName": "HILUX VIGO 2.5D 3.0D ตัวเตี้ย",
        "engineId": "e-toyota-hilux-vigo-2-5d-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-283-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-innova-2-0",
        "modelName": "INNOVA 2.0",
        "engineId": "e-toyota-innova-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2003,
        "yearRangeText": "2003",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-284",
    "sku": "P83 096N",
    "name": "Brembo Pad NAO P83 096N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0K160",
      "GDB7669",
      "DB1741"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 950,
    "supplierListPrice": 950,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-284",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-284-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-vigo-2-5d-3-0d",
        "modelName": "HILUX VIGO 2.5D 3.0D ตัวเตี้ย",
        "engineId": "e-toyota-hilux-vigo-2-5d-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2008,
        "yearRangeText": "2004 - 2008",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-284-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-innova-2-0",
        "modelName": "INNOVA 2.0",
        "engineId": "e-toyota-innova-2-0",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2003,
        "yearTo": 2003,
        "yearRangeText": "2003",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-285",
    "sku": "P83 137B",
    "name": "Brembo Pad Low-M P83 137B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0K290",
      "GDB7773",
      "DB1985"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 970,
    "supplierListPrice": 970,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-285",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-285-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-vigo-smart-open-cab-2-5d-3-0d",
        "modelName": "HILUX VIGO SMART (Open cab) 2.5D 3.0D ตัวเตี้ย",
        "engineId": "e-toyota-hilux-vigo-smart-open-cab-2-5d-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2011,
        "yearRangeText": "2008 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-285-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-vigo-champ-2-5d-3-0d",
        "modelName": "HILUX VIGO CHAMP 2.5D 3.0D ตัวเตี้ย",
        "engineId": "e-toyota-hilux-vigo-champ-2-5d-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2015,
        "yearRangeText": "2011 - 2015",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-286",
    "sku": "P83 137N",
    "name": "Brembo Pad NAO P83 137N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0K290",
      "GDB7773",
      "DB1985"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1040,
    "supplierListPrice": 1040,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-286",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-286-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-vigo-smart-open-cab-2-5d-3-0d",
        "modelName": "HILUX VIGO SMART (Open cab) 2.5D 3.0D ตัวเตี้ย",
        "engineId": "e-toyota-hilux-vigo-smart-open-cab-2-5d-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2008,
        "yearTo": 2011,
        "yearRangeText": "2008 - 2011",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-286-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-vigo-champ-2-5d-3-0d",
        "modelName": "HILUX VIGO CHAMP 2.5D 3.0D ตัวเตี้ย",
        "engineId": "e-toyota-hilux-vigo-champ-2-5d-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2015,
        "yearRangeText": "2011 - 2015",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-287",
    "sku": "P83 140B",
    "name": "Brembo Pad Low-M P83 140B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0K240",
      "GDB3534",
      "DB2221"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1150,
    "supplierListPrice": 1150,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-287",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-287-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-vigo-champ-2-5d-2-7d-3-0d",
        "modelName": "HILUX VIGO CHAMP 2.5D 2.7D 3.0D ตัวสูง",
        "engineId": "e-toyota-hilux-vigo-champ-2-5d-2-7d-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2015,
        "yearRangeText": "2011 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-287-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-revo-standard-cab-2-8d",
        "modelName": "HILUX REVO (Standard Cab) 2.8D ตัวสูง",
        "engineId": "e-toyota-hilux-revo-standard-cab-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2019,
        "yearRangeText": "2015 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-287-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-revo-standard-cab-2-8d",
        "modelName": "HILUX REVO (Standard Cab) 2.8D ตัวสูง",
        "engineId": "e-toyota-hilux-revo-standard-cab-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-288",
    "sku": "P83 140N",
    "name": "Brembo Pad NAO P83 140N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0K240",
      "GDB3534",
      "DB2221"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1350,
    "supplierListPrice": 1350,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-288",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-288-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-vigo-champ-2-5d-2-7d-3-0d",
        "modelName": "HILUX VIGO CHAMP 2.5D 2.7D 3.0D ตัวสูง",
        "engineId": "e-toyota-hilux-vigo-champ-2-5d-2-7d-3-0d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2011,
        "yearTo": 2015,
        "yearRangeText": "2011 - 2015",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-288-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-revo-standard-cab-2-8d",
        "modelName": "HILUX REVO (Standard Cab) 2.8D ตัวสูง",
        "engineId": "e-toyota-hilux-revo-standard-cab-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2019,
        "yearRangeText": "2015 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-288-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-revo-standard-cab-2-8d",
        "modelName": "HILUX REVO (Standard Cab) 2.8D ตัวสูง",
        "engineId": "e-toyota-hilux-revo-standard-cab-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-289",
    "sku": "P83 167N",
    "name": "Brembo Pad NAO P83 167N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0K420",
      "GDB7996",
      "DB2396"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1090,
    "supplierListPrice": 1090,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-289",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-289-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-revo-standard-cab-2-4d-2-7l-2-8d",
        "modelName": "HILUX REVO (Standard Cab) 2.4D 2.7L 2.8D ตัวเตี้ย",
        "engineId": "e-toyota-hilux-revo-standard-cab-2-4d-2-7l-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2019,
        "yearRangeText": "2015 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-289-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-revo-2-4d-2-7l-2-8d",
        "modelName": "HILUX REVO 2.4D 2.7L 2.8D ตัวเตี้ย",
        "engineId": "e-toyota-hilux-revo-2-4d-2-7l-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-290",
    "sku": "P83 170N",
    "name": "Brembo Pad NAO P83 170N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "044650K430",
      "GDB8999"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1210,
    "supplierListPrice": 1210,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-290",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-290-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-hilux-revo-smart-cab-double-cab-2-4d-2-7l-2-8d",
        "modelName": "HILUX REVO (Smart Cab/Double Cab) 2.4D 2.7L 2.8D ตัวเตี้ย",
        "engineId": "e-toyota-hilux-revo-smart-cab-double-cab-2-4d-2-7l-2-8d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2015,
        "yearTo": 2019,
        "yearRangeText": "2015 - 2019",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-290-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-innova-crysta-2-0l-2-7d",
        "modelName": "INNOVA CRYSTA 2.0L 2.7D",
        "engineId": "e-toyota-innova-crysta-2-0l-2-7d",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2016,
        "yearRangeText": "2016 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-291",
    "sku": "P83 094N",
    "name": "Brembo Pad NAO P83 094N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0K130",
      "GDB3427",
      "DB1751"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1040,
    "supplierListPrice": 1040,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-291",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-291-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-innova-2-0-2-5-2-7",
        "modelName": "INNOVA 2.0 2.5 2.7",
        "engineId": "e-toyota-innova-2-0-2-5-2-7",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2004,
        "yearTo": 2015,
        "yearRangeText": "2004 - 2015",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-292",
    "sku": "P83 025N",
    "name": "Brembo Pad NAO P83 025N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0446560020",
      "GDB1154"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1140,
    "supplierListPrice": 1140,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-292",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-292-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-land-cruiser-hzj80-vx80-4-2l-4-5l-4wd",
        "modelName": "LAND CRUISER (HZJ80) VX80 4.2L 4.5L 4WD",
        "engineId": "e-toyota-land-cruiser-hzj80-vx80-4-2l-4-5l-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1990,
        "yearTo": 1998,
        "yearRangeText": "1990 - 1998",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-293",
    "sku": "P83 048N",
    "name": "Brembo Pad NAO P83 048N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0446560120",
      "GDB3197",
      "DB1365"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1520,
    "supplierListPrice": 1520,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-293",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-293-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-land-cruiser-vx100-4-2d-4-7d-4wd",
        "modelName": "LAND CRUISER VX100 4.2D 4.7D 4WD",
        "engineId": "e-toyota-land-cruiser-vx100-4-2d-4-7d-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1999,
        "yearTo": 2007,
        "yearRangeText": "1999 - 2007",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-293-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-lx470-j100-4-7-01",
        "modelName": "LX470 (j100) 4.7 (ปี01)",
        "engineId": "e-lexus-lx470-j100-4-7-01",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearTo": 2008,
        "yearRangeText": "2001 - 2008",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-294",
    "sku": "P83 049B",
    "name": "Brembo Pad Low-M P83 049B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-60030",
      "GDB3198",
      "DB1383"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1050,
    "supplierListPrice": 1050,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-294",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-294-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-land-cruiser-vx100-4-2d-4-7d-4wd",
        "modelName": "LAND CRUISER VX100 4.2D 4.7D 4WD",
        "engineId": "e-toyota-land-cruiser-vx100-4-2d-4-7d-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1999,
        "yearTo": 2007,
        "yearRangeText": "1999 - 2007",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-294-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-lx470-j100-4-7-01",
        "modelName": "LX470 (j100) 4.7 (ปี01)",
        "engineId": "e-lexus-lx470-j100-4-7-01",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearTo": 2008,
        "yearRangeText": "2001 - 2008",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-294-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx300",
        "modelName": "RX300",
        "engineId": "e-lexus-rx300",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2003,
        "yearRangeText": "1998 - 2003",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-295",
    "sku": "P83 049N",
    "name": "Brembo Pad NAO P83 049N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-60030",
      "GDB3198",
      "DB1383"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1090,
    "supplierListPrice": 1090,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-295",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-295-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-land-cruiser-vx100-4-2d-4-7d-4wd",
        "modelName": "LAND CRUISER VX100 4.2D 4.7D 4WD",
        "engineId": "e-toyota-land-cruiser-vx100-4-2d-4-7d-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1999,
        "yearTo": 2007,
        "yearRangeText": "1999 - 2007",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-295-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-lx470-j100-4-7-01",
        "modelName": "LX470 (j100) 4.7 (ปี01)",
        "engineId": "e-lexus-lx470-j100-4-7-01",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2001,
        "yearTo": 2008,
        "yearRangeText": "2001 - 2008",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-295-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-rx300",
        "modelName": "RX300",
        "engineId": "e-lexus-rx300",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1998,
        "yearTo": 2003,
        "yearRangeText": "1998 - 2003",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-296",
    "sku": "P83 028B",
    "name": "Brembo Pad Low-M P83 028B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-12160",
      "GDB1145",
      "DB1352"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1700,
    "supplierListPrice": 1700,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-296",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-296-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-mr-2-sw20-2-0t",
        "modelName": "MR-2 SW20 2.0T",
        "engineId": "e-toyota-mr-2-sw20-2-0t",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1989,
        "yearTo": 2000,
        "yearRangeText": "1989 - 2000",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-297",
    "sku": "P83 106B",
    "name": "Brembo Pad Low-M P83 106B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-47060",
      "GDB4173",
      "DB2159"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1200,
    "supplierListPrice": 1200,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-297",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-297-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-prius-1-8-hybrid",
        "modelName": "PRIUS 1.8 Hybrid",
        "engineId": "e-toyota-prius-1-8-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2014,
        "yearRangeText": "2009 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-297-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ct200h-1-8l-hybrid",
        "modelName": "CT200h 1.8L Hybrid",
        "engineId": "e-lexus-ct200h-1-8l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2016,
        "yearRangeText": "2010 - 2016",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-298",
    "sku": "P83 106N",
    "name": "Brembo Pad NAO P83 106N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-47060",
      "GDB4173",
      "DB2159"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1280,
    "supplierListPrice": 1280,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-298",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-298-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-prius-1-8-hybrid",
        "modelName": "PRIUS 1.8 Hybrid",
        "engineId": "e-toyota-prius-1-8-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2009,
        "yearTo": 2014,
        "yearRangeText": "2009 - 2014",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-298-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ct200h-1-8l-hybrid",
        "modelName": "CT200h 1.8L Hybrid",
        "engineId": "e-lexus-ct200h-1-8l-hybrid",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2010,
        "yearTo": 2016,
        "yearRangeText": "2010 - 2016",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-299",
    "sku": "P83 057N",
    "name": "Brembo Pad NAO P83 057N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0446642010"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1180,
    "supplierListPrice": 1180,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-299",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-299-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-rav4-i-a1-2-0l-2wd-4wd",
        "modelName": "RAV4 I (A1) 2.0L 2WD/4WD",
        "engineId": "e-toyota-rav4-i-a1-2-0l-2wd-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1994,
        "yearTo": 2000,
        "yearRangeText": "1994 - 2000",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-299-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-rav4-ii-a2-2-0l-4wd",
        "modelName": "RAV4 II (A2) 2.0L 4WD",
        "engineId": "e-toyota-rav4-ii-a2-2-0l-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2005,
        "yearRangeText": "2000 - 2005",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-300",
    "sku": "P83 055N",
    "name": "Brembo Pad NAO P83 055N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "0446542071 / 0446542130",
      "GDB3251"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1180,
    "supplierListPrice": 1180,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-300",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-300-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-rav4-ii-a2-2-0l-4wd",
        "modelName": "RAV4 II (A2) 2.0L 4WD",
        "engineId": "e-toyota-rav4-ii-a2-2-0l-4wd",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2005,
        "yearRangeText": "2000 - 2005",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-301",
    "sku": "P83 090B",
    "name": "Brembo Pad Low-M P83 090B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-20100",
      "GDB3106"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2600,
    "supplierListPrice": 2600,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-301",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-301-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-supra-jza80-3-0t",
        "modelName": "SUPRA JZA80 3.0T",
        "engineId": "e-toyota-supra-jza80-3-0t",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1999,
        "yearRangeText": "1993 - 1999",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-302",
    "sku": "P83 091B",
    "name": "Brembo Pad Low-M P83 091B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-14040",
      "GDB3105"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1800,
    "supplierListPrice": 1800,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-302",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-302-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-supra-jza80-3-0t",
        "modelName": "SUPRA JZA80 3.0T",
        "engineId": "e-toyota-supra-jza80-3-0t",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 1999,
        "yearRangeText": "1993 - 1999",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-303",
    "sku": "P06 099N",
    "name": "Brembo Pad NAO P06 099N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "34116872750 / 34116874430",
      "GDB8094"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 4800,
    "supplierListPrice": 4800,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-303",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-303-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-supra-db-2-0-db22-db21-db23-3-0-gr-db41-db42-db43",
        "modelName": "SUPRA (DB) 2.0 (DB22 DB21 DB23) 3.0 GR (DB41 DB42 DB43)",
        "engineId": "e-toyota-supra-db-2-0-db22-db21-db23-3-0-gr-db41-db42-db43",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-304",
    "sku": "P06 114N",
    "name": "Brembo Pad NAO P06 114N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466WAA01",
      "GDB8284"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2000,
    "supplierListPrice": 2000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-304",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-304-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-supra-db-2-0-db22-db21-db23-3-0-gr-db41-db42-db43",
        "modelName": "SUPRA (DB) 2.0 (DB22 DB21 DB23) 3.0 GR (DB41 DB42 DB43)",
        "engineId": "e-toyota-supra-db-2-0-db22-db21-db23-3-0-gr-db41-db42-db43",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2019,
        "yearRangeText": "2019 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-305",
    "sku": "P06 116N",
    "name": "Brembo Pad NAO P06 116N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "34206888835 / 04466WAA03",
      "GDB2419"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 3000,
    "supplierListPrice": 3000,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-305",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-305-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-supra-db-2-0-db22-db21-db23-db26-3-0-gr",
        "modelName": "SUPRA (DB) 2.0 (DB22 DB21 DB23 DB26) 3.0 GR",
        "engineId": "e-toyota-supra-db-2-0-db22-db21-db23-db26-3-0-gr",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2020,
        "yearRangeText": "2020 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-306",
    "sku": "P83 086N",
    "name": "Brembo Pad NAO P83 086N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-52200",
      "GDB3459",
      "DB1820"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 840,
    "supplierListPrice": 840,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-306",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-306-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vios-ncp90-j-e-1-5l",
        "modelName": "VIOS (NCP90) J/E 1.5L",
        "engineId": "e-toyota-vios-ncp90-j-e-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2013,
        "yearRangeText": "2007 - 2013",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-306-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-yaris-j-e-g-1-5l",
        "modelName": "YARIS J/E/G 1.5L",
        "engineId": "e-toyota-yaris-j-e-g-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2012,
        "yearRangeText": "2006 - 2012",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-307",
    "sku": "P83 101N",
    "name": "Brembo Pad NAO P83 101N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0D130",
      "GDB7728",
      "DB1785"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 970,
    "supplierListPrice": 970,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-307",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-307-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vios-ncp90-g-s-1-5l",
        "modelName": "VIOS (NCP90) G/S 1.5L",
        "engineId": "e-toyota-vios-ncp90-g-s-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearTo": 2013,
        "yearRangeText": "2007 - 2013",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-307-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vios-g-s-1-5l",
        "modelName": "VIOS G/S 1.5L",
        "engineId": "e-toyota-vios-g-s-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2016,
        "yearRangeText": "2013 - 2016",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-307-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vios-g-s-mid-high-1-5l",
        "modelName": "VIOS G/S/Mid/High 1.5L",
        "engineId": "e-toyota-vios-g-s-mid-high-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-307-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-yaris-s-rs-1-5l",
        "modelName": "YARIS S/RS 1.5L",
        "engineId": "e-toyota-yaris-s-rs-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2006,
        "yearTo": 2012,
        "yearRangeText": "2006 - 2012",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-308",
    "sku": "P83 165N",
    "name": "Brembo Pad NAO P83 165N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-0D150",
      "GDB7902",
      "DB2261"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1020,
    "supplierListPrice": 1020,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-308",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-308-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vios-j-e-1-5l",
        "modelName": "VIOS J/E 1.5L",
        "engineId": "e-toyota-vios-j-e-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2016,
        "yearRangeText": "2013 - 2016",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-308-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-vios-j-e-entry-1-5l",
        "modelName": "VIOS J/E/Entry 1.5L",
        "engineId": "e-toyota-vios-j-e-entry-1-5l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-308-2",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-yaris-j-e-g-trd-1-2l",
        "modelName": "YARIS J/E/G/TRD 1.2L",
        "engineId": "e-toyota-yaris-j-e-g-trd-1-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2013,
        "yearTo": 2017,
        "yearRangeText": "2013 - 2017",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-308-3",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-yaris-j-eco-j-e-g-1-2l",
        "modelName": "YARIS J Eco/J/E/G 1.2L",
        "engineId": "e-toyota-yaris-j-eco-j-e-g-1-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearRangeText": "2017 -",
        "brakePosition": "front"
      },
      {
        "id": "vf-brembo-308-4",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-yaris-ativ-1-2l",
        "modelName": "YARIS ATIV 1.2L",
        "engineId": "e-toyota-yaris-ativ-1-2l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2017,
        "yearTo": 2022,
        "yearRangeText": "2017 - 2022",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-309",
    "sku": "P83 169N",
    "name": "Brembo Pad NAO P83 169N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-28120"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2050,
    "supplierListPrice": 2050,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-309",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-309-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-toyota",
        "brandName": "Toyota",
        "modelId": "m-toyota-voxy-zrr80w-14-noah",
        "modelName": "VOXY ZRR80W (ปี14) / NOAH",
        "engineId": "e-toyota-voxy-zrr80w-14-noah",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2014,
        "yearTo": 2014,
        "yearRangeText": "2014",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-310",
    "sku": "P83 072N",
    "name": "Brembo Pad NAO P83 072N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-30430",
      "GDB3398"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1800,
    "supplierListPrice": 1800,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-310",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-310-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-gs300-grs190-grs195-3-0l",
        "modelName": "GS300 (GRS190 GRS195) 3.0L",
        "engineId": "e-lexus-gs300-grs190-grs195-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearRangeText": "2005 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-311",
    "sku": "P83 073N",
    "name": "Brembo Pad NAO P83 073N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-22190",
      "GDB3399",
      "DB1854"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1420,
    "supplierListPrice": 1420,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-311",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-311-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-gs300-grs190-grs195-3-0l",
        "modelName": "GS300 (GRS190 GRS195) 3.0L",
        "engineId": "e-lexus-gs300-grs190-grs195-3-0l",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearRangeText": "2005 -",
        "brakePosition": "rear"
      },
      {
        "id": "vf-brembo-311-1",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-is250-gse20-2-5l-v6",
        "modelName": "IS250 (GSE20) 2.5L V6",
        "engineId": "e-lexus-is250-gse20-2-5l-v6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2013,
        "yearRangeText": "2005 - 2013",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-312",
    "sku": "P83 074B",
    "name": "Brembo Pad Low-M P83 074B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-53020",
      "GDB3410",
      "DB1852"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1650,
    "supplierListPrice": 1650,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-312",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-312-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-is250-gse20-2-5l-v6",
        "modelName": "IS250 (GSE20) 2.5L V6",
        "engineId": "e-lexus-is250-gse20-2-5l-v6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2013,
        "yearRangeText": "2005 - 2013",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-313",
    "sku": "P83 074N",
    "name": "Brembo Pad NAO P83 074N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-53020",
      "GDB3410",
      "DB1852"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1750,
    "supplierListPrice": 1750,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-313",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-313-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-is250-gse20-2-5l-v6",
        "modelName": "IS250 (GSE20) 2.5L V6",
        "engineId": "e-lexus-is250-gse20-2-5l-v6",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2005,
        "yearTo": 2013,
        "yearRangeText": "2005 - 2013",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-314",
    "sku": "P83 039N",
    "name": "Brembo Pad NAO P83 039N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-50060",
      "GDB3226",
      "DB1421"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1660,
    "supplierListPrice": 1660,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-314",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-314-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ls400-ucf20-4-0l-aristo-aristo-4pot",
        "modelName": "LS400 (UCF20) 4.0L / ARISTO (ปั๊ม Aristo 4Pot)",
        "engineId": "e-lexus-ls400-ucf20-4-0l-aristo-aristo-4pot",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 1993,
        "yearTo": 2002,
        "yearRangeText": "1993 - 2002",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-315",
    "sku": "P83 058N",
    "name": "Brembo Pad NAO P83 058N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-50170",
      "GDB3322",
      "DB1496"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1500,
    "supplierListPrice": 1500,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-315",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-315-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ls430-ucf30-4-3l-3uz-4pot",
        "modelName": "LS430 (UCF30) 4.3L (ปั๊มหน้า 3UZ 4Pot)",
        "engineId": "e-lexus-ls430-ucf30-4-3l-3uz-4pot",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2004,
        "yearRangeText": "2000 - 2004",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-316",
    "sku": "P83 059N",
    "name": "Brembo Pad NAO P83 059N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-50120",
      "GDB3323",
      "DB1497"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1700,
    "supplierListPrice": 1700,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-316",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-316-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ls430-ucf30-4-3l-3uz-4pot",
        "modelName": "LS430 (UCF30) 4.3L (ปั๊มหน้า 3UZ 4Pot)",
        "engineId": "e-lexus-ls430-ucf30-4-3l-3uz-4pot",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2000,
        "yearTo": 2004,
        "yearRangeText": "2000 - 2004",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-317",
    "sku": "P83 075N",
    "name": "Brembo Pad NAO P83 075N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "044650W110",
      "GDB3473"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2560,
    "supplierListPrice": 2560,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-317",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-317-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ls460-xf40-07-ls350-xf50-18",
        "modelName": "LS460 XF40 (ปี07) / LS350 XF50 (ปี18)",
        "engineId": "e-lexus-ls460-xf40-07-ls350-xf50-18",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearRangeText": "2007, 2018",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-318",
    "sku": "P83 076N",
    "name": "Brembo Pad NAO P83 076N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "044660W020",
      "GDB3475"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1700,
    "supplierListPrice": 1700,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-318",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-318-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-ls460-xf40-07-ls350-xf50-18",
        "modelName": "LS460 XF40 (ปี07) / LS350 XF50 (ปี18)",
        "engineId": "e-lexus-ls460-xf40-07-ls350-xf50-18",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearRangeText": "2007, 2018",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-319",
    "sku": "P83 107B",
    "name": "Brembo Pad Low-M P83 107B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-60280",
      "GDB3524",
      "DB1838"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2050,
    "supplierListPrice": 2050,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-319",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-319-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-lx-urj201-land-cruiser-200",
        "modelName": "LX (URJ201) / LAND CRUISER 200",
        "engineId": "e-lexus-lx-urj201-land-cruiser-200",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearRangeText": "2007 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-320",
    "sku": "P83 107N",
    "name": "Brembo Pad NAO P83 107N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04465-60280",
      "GDB3524",
      "DB1838"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 2300,
    "supplierListPrice": 2300,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-320",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-320-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-lx-urj201-land-cruiser-200",
        "modelName": "LX (URJ201) / LAND CRUISER 200",
        "engineId": "e-lexus-lx-urj201-land-cruiser-200",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearRangeText": "2007 -",
        "brakePosition": "front"
      }
    ]
  },
  {
    "id": "pm-brembo-321",
    "sku": "P83 098B",
    "name": "Brembo Pad Low-M P83 098B",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-60120",
      "GDB3491",
      "DB1857"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1400,
    "supplierListPrice": 1400,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-321",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-321-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-lx-urj201-land-cruiser-200",
        "modelName": "LX (URJ201) / LAND CRUISER 200",
        "engineId": "e-lexus-lx-urj201-land-cruiser-200",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearRangeText": "2007 -",
        "brakePosition": "rear"
      }
    ]
  },
  {
    "id": "pm-brembo-322",
    "sku": "P83 098N",
    "name": "Brembo Pad NAO P83 098N",
    "brand": "Brembo",
    "category": "เบรก",
    "subCategory": "ผ้าเบรก",
    "carBrand": "—",
    "carModelLabel": "—",
    "yearLabel": "—",
    "oemTags": [
      "04466-60120",
      "GDB3491",
      "DB1857"
    ],
    "carModels": [],
    "costPrice": 0,
    "scheme": "—",
    "avgCost": 0,
    "sellPrice": 1600,
    "supplierListPrice": 1600,
    "purchaseDiscountPcts": [
      0,
      0,
      0,
      0
    ],
    "salesUnits": [
      {
        "id": "u-piece",
        "label": "ชุด",
        "baseUnits": 1
      }
    ],
    "crossBranch": [
      {
        "id": "cb-brembo-322",
        "locationLabel": "คลังกลาง",
        "stock": 0,
        "position": "—",
        "status": "normal"
      }
    ],
    "vehicleFitments": [
      {
        "id": "vf-brembo-322-0",
        "categoryId": "vehicle",
        "categoryLabel": "รถยนต์",
        "brandId": "b-lexus",
        "brandName": "Lexus",
        "modelId": "m-lexus-lx-urj201-land-cruiser-200",
        "modelName": "LX (URJ201) / LAND CRUISER 200",
        "engineId": "e-lexus-lx-urj201-land-cruiser-200",
        "engineLabel": "ไม่ระบุเครื่อง/ปี",
        "vehicleType": "รถยนต์",
        "yearFrom": 2007,
        "yearRangeText": "2007 -",
        "brakePosition": "rear"
      }
    ]
  }
] as const
