import type { Account } from './auth';
import type { CompanyEvent } from './company-store';

export const demoPassword = 'SurgeDemo2026!';
export const demoCompanies = [
  {
    "id": "qs-demo-v1-company-puerto",
    "name": "Puerto Producciones",
    "email": "puerto@demo.quesurge.test",
    "contact": "María Benítez",
    "description": "Conciertos y experiencias musicales en Asunción y Luque.",
    "photo": "eventos/pulso.jpg",
    "validatorId": "qs-demo-v1-validator-puerto",
    "validatorEmail": "acceso.puerto@demo.quesurge.test"
  },
  {
    "id": "qs-demo-v1-company-sabores",
    "name": "Sabores del Sur",
    "email": "sabores@demo.quesurge.test",
    "contact": "Diego González",
    "description": "Ferias gastronómicas y encuentros de cocina local.",
    "photo": "eventos/mesa.jpg",
    "validatorId": "qs-demo-v1-validator-sabores",
    "validatorEmail": "acceso.sabores@demo.quesurge.test"
  },
  {
    "id": "qs-demo-v1-company-nanduti",
    "name": "Ñandutí Cultural",
    "email": "nanduti@demo.quesurge.test",
    "contact": "Sofía Martínez",
    "description": "Arte, teatro y actividades culturales para compartir.",
    "photo": "eventos/arte.jpg",
    "validatorId": "qs-demo-v1-validator-nanduti",
    "validatorEmail": "acceso.nanduti@demo.quesurge.test"
  }
];

export const demoBuyers = [
  {
    "id": "qs-demo-v1-buyer-ana",
    "name": "Ana López",
    "email": "ana@demo.quesurge.test"
  },
  {
    "id": "qs-demo-v1-buyer-luis",
    "name": "Luis Vera",
    "email": "luis@demo.quesurge.test"
  },
  {
    "id": "qs-demo-v1-buyer-camila",
    "name": "Camila Rojas",
    "email": "camila@demo.quesurge.test"
  }
];

export const demoEvents: (Omit<CompanyEvent, 'startsAt'> & { days: number; hour: number })[] = [
  {
    "id": "qs-demo-v1-event-jazz",
    "ownerId": "qs-demo-v1-company-puerto",
    "organizer": "Puerto Producciones",
    "title": "Noche de jazz en el puerto",
    "category": "Música",
    "days": 2,
    "hour": 20,
    "venue": "Puerto de Asunción",
    "city": "Asunción",
    "photo": "eventos/pulso.jpg",
    "description": "Evento ficticio de demostración de Puerto Producciones. Un espacio para descubrir propuestas locales y compartir experiencias en Asunción.",
    "status": "published",
    "version": 1,
    "tickets": [
      {
        "id": "qs-demo-v1-event-jazz-general",
        "name": "General",
        "price": 85000,
        "capacity": 100
      },
      {
        "id": "qs-demo-v1-event-jazz-vip",
        "name": "Preferencial",
        "price": 150000,
        "capacity": 40
      }
    ]
  },
  {
    "id": "qs-demo-v1-event-sunset",
    "ownerId": "qs-demo-v1-company-puerto",
    "organizer": "Puerto Producciones",
    "title": "Sunset en Luque",
    "category": "Música",
    "days": 9,
    "hour": 18,
    "venue": "Patio del Norte",
    "city": "Luque",
    "photo": "eventos/sesiones.jpg",
    "description": "Evento ficticio de demostración de Puerto Producciones. Un espacio para descubrir propuestas locales y compartir experiencias en Luque.",
    "status": "published",
    "version": 1,
    "tickets": [
      {
        "id": "qs-demo-v1-event-sunset-general",
        "name": "General",
        "price": 65000,
        "capacity": 100
      },
      {
        "id": "qs-demo-v1-event-sunset-vip",
        "name": "Preferencial",
        "price": 150000,
        "capacity": 40
      }
    ]
  },
  {
    "id": "qs-demo-v1-event-mesa",
    "ownerId": "qs-demo-v1-company-sabores",
    "organizer": "Sabores del Sur",
    "title": "Mesa paraguaya",
    "category": "Gastronomía",
    "days": 4,
    "hour": 19,
    "venue": "Paseo Gastronómico del Sur",
    "city": "Encarnación",
    "photo": "eventos/mesa.jpg",
    "description": "Evento ficticio de demostración de Sabores del Sur. Un espacio para descubrir propuestas locales y compartir experiencias en Encarnación.",
    "status": "published",
    "version": 1,
    "tickets": [
      {
        "id": "qs-demo-v1-event-mesa-general",
        "name": "General",
        "price": 65000,
        "capacity": 100
      },
      {
        "id": "qs-demo-v1-event-mesa-vip",
        "name": "Preferencial",
        "price": 110000,
        "capacity": 40
      }
    ]
  },
  {
    "id": "qs-demo-v1-event-sabores",
    "ownerId": "qs-demo-v1-company-sabores",
    "organizer": "Sabores del Sur",
    "title": "Festival de sabores",
    "category": "Gastronomía",
    "days": 12,
    "hour": 17,
    "venue": "Mercado Cultural",
    "city": "Asunción",
    "photo": "eventos/feria.jpg",
    "description": "Evento ficticio de demostración de Sabores del Sur. Un espacio para descubrir propuestas locales y compartir experiencias en Asunción.",
    "status": "published",
    "version": 1,
    "tickets": [
      {
        "id": "qs-demo-v1-event-sabores-general",
        "name": "General",
        "price": 75000,
        "capacity": 100
      },
      {
        "id": "qs-demo-v1-event-sabores-vip",
        "name": "Preferencial",
        "price": 120000,
        "capacity": 40
      }
    ]
  },
  {
    "id": "qs-demo-v1-event-arte",
    "ownerId": "qs-demo-v1-company-nanduti",
    "organizer": "Ñandutí Cultural",
    "title": "Encuentro de arte y ñandutí",
    "category": "Arte",
    "days": 6,
    "hour": 16,
    "venue": "Casa Cultural San Lorenzo",
    "city": "San Lorenzo",
    "photo": "eventos/arte.jpg",
    "description": "Evento ficticio de demostración de Ñandutí Cultural. Un espacio para descubrir propuestas locales y compartir experiencias en San Lorenzo.",
    "status": "published",
    "version": 1,
    "tickets": [
      {
        "id": "qs-demo-v1-event-arte-general",
        "name": "General",
        "price": 45000,
        "capacity": 100
      },
      {
        "id": "qs-demo-v1-event-arte-vip",
        "name": "Preferencial",
        "price": 70000,
        "capacity": 40
      }
    ]
  },
  {
    "id": "qs-demo-v1-event-teatro",
    "ownerId": "qs-demo-v1-company-nanduti",
    "organizer": "Ñandutí Cultural",
    "title": "Una noche de teatro",
    "category": "Teatro",
    "days": 14,
    "hour": 20,
    "venue": "Sala Cultural del Centro",
    "city": "Asunción",
    "photo": "eventos/arte.jpg",
    "description": "Evento ficticio de demostración de Ñandutí Cultural. Un espacio para descubrir propuestas locales y compartir experiencias en Asunción.",
    "status": "published",
    "version": 1,
    "tickets": [
      {
        "id": "qs-demo-v1-event-teatro-general",
        "name": "General",
        "price": 60000,
        "capacity": 100
      },
      {
        "id": "qs-demo-v1-event-teatro-vip",
        "name": "Preferencial",
        "price": 95000,
        "capacity": 40
      }
    ]
  }
];

export const demoAccounts: Account[] = [
  {
    "role": "company",
    "companyName": "Puerto Producciones",
    "companyId": "",
    "assignedEventIds": [],
    "enabled": true,
    "preferences": {
      "interests": [
        "Música",
        "Gastronomía",
        "Arte",
        "Teatro",
        "Bienestar",
        "Comunidad"
      ],
      "city": "Todo Paraguay",
      "completed": true
    },
    "id": "qs-demo-v1-company-puerto",
    "name": "María Benítez",
    "email": "puerto@demo.quesurge.test",
    "salt": "que-surge-demo-v1-salt-0",
    "passwordHash": "849a83b75bf5fb39522a781c5eeff1645db6a41855e21ff65544d9f79fc6d6ed"
  },
  {
    "role": "company",
    "companyName": "Sabores del Sur",
    "companyId": "",
    "assignedEventIds": [],
    "enabled": true,
    "preferences": {
      "interests": [
        "Música",
        "Gastronomía",
        "Arte",
        "Teatro",
        "Bienestar",
        "Comunidad"
      ],
      "city": "Todo Paraguay",
      "completed": true
    },
    "id": "qs-demo-v1-company-sabores",
    "name": "Diego González",
    "email": "sabores@demo.quesurge.test",
    "salt": "que-surge-demo-v1-salt-1",
    "passwordHash": "17ce3feda94b1b1ae2eb97cd354f102ae653d16fa833ac17b3aac06fc515116d"
  },
  {
    "role": "company",
    "companyName": "Ñandutí Cultural",
    "companyId": "",
    "assignedEventIds": [],
    "enabled": true,
    "preferences": {
      "interests": [
        "Música",
        "Gastronomía",
        "Arte",
        "Teatro",
        "Bienestar",
        "Comunidad"
      ],
      "city": "Todo Paraguay",
      "completed": true
    },
    "id": "qs-demo-v1-company-nanduti",
    "name": "Sofía Martínez",
    "email": "nanduti@demo.quesurge.test",
    "salt": "que-surge-demo-v1-salt-2",
    "passwordHash": "d10ca4bf781cffce288247bea8a57e7fdd6e969fc51b3f5a6758e1173a938376"
  },
  {
    "role": "person",
    "companyName": "",
    "companyId": "",
    "assignedEventIds": [],
    "enabled": true,
    "preferences": {
      "interests": [
        "Música",
        "Gastronomía",
        "Arte",
        "Teatro",
        "Bienestar",
        "Comunidad"
      ],
      "city": "Todo Paraguay",
      "completed": true
    },
    "id": "qs-demo-v1-buyer-ana",
    "name": "Ana López",
    "email": "ana@demo.quesurge.test",
    "salt": "que-surge-demo-v1-salt-3",
    "passwordHash": "d8975d10aca6ebef0d9a03c97416b1a96fe6a7bd42eb0b3b4086ac139d789d4c"
  },
  {
    "role": "person",
    "companyName": "",
    "companyId": "",
    "assignedEventIds": [],
    "enabled": true,
    "preferences": {
      "interests": [
        "Música",
        "Gastronomía",
        "Arte",
        "Teatro",
        "Bienestar",
        "Comunidad"
      ],
      "city": "Todo Paraguay",
      "completed": true
    },
    "id": "qs-demo-v1-buyer-luis",
    "name": "Luis Vera",
    "email": "luis@demo.quesurge.test",
    "salt": "que-surge-demo-v1-salt-4",
    "passwordHash": "a79f0be2ff7795c0da44dfbf33075c29e82ea44b88b7e39566548da55dc2614f"
  },
  {
    "role": "person",
    "companyName": "",
    "companyId": "",
    "assignedEventIds": [],
    "enabled": true,
    "preferences": {
      "interests": [
        "Música",
        "Gastronomía",
        "Arte",
        "Teatro",
        "Bienestar",
        "Comunidad"
      ],
      "city": "Todo Paraguay",
      "completed": true
    },
    "id": "qs-demo-v1-buyer-camila",
    "name": "Camila Rojas",
    "email": "camila@demo.quesurge.test",
    "salt": "que-surge-demo-v1-salt-5",
    "passwordHash": "5d599ad5cc828d2bfb9000476c4052f70bc37d7feafb55099f7bd3d51b477cef"
  },
  {
    "role": "validator",
    "companyName": "Puerto Producciones",
    "companyId": "qs-demo-v1-company-puerto",
    "assignedEventIds": [
      "qs-demo-v1-event-jazz",
      "qs-demo-v1-event-sunset"
    ],
    "enabled": true,
    "preferences": {
      "interests": [
        "Música",
        "Gastronomía",
        "Arte",
        "Teatro",
        "Bienestar",
        "Comunidad"
      ],
      "city": "Todo Paraguay",
      "completed": true
    },
    "id": "qs-demo-v1-validator-puerto",
    "name": "Acceso · Puerto Producciones",
    "email": "acceso.puerto@demo.quesurge.test",
    "salt": "que-surge-demo-v1-salt-6",
    "passwordHash": "b25b917869538f4eb4d79b788ec4da8ba3d756c7525ab48efe4a6221129e4444"
  },
  {
    "role": "validator",
    "companyName": "Sabores del Sur",
    "companyId": "qs-demo-v1-company-sabores",
    "assignedEventIds": [
      "qs-demo-v1-event-mesa",
      "qs-demo-v1-event-sabores"
    ],
    "enabled": true,
    "preferences": {
      "interests": [
        "Música",
        "Gastronomía",
        "Arte",
        "Teatro",
        "Bienestar",
        "Comunidad"
      ],
      "city": "Todo Paraguay",
      "completed": true
    },
    "id": "qs-demo-v1-validator-sabores",
    "name": "Acceso · Sabores del Sur",
    "email": "acceso.sabores@demo.quesurge.test",
    "salt": "que-surge-demo-v1-salt-7",
    "passwordHash": "006fa70c2625eba8d1d8e921a5ac6747b78ad45c17202e4ca8b7d5ed0f9742ec"
  },
  {
    "role": "validator",
    "companyName": "Ñandutí Cultural",
    "companyId": "qs-demo-v1-company-nanduti",
    "assignedEventIds": [
      "qs-demo-v1-event-arte",
      "qs-demo-v1-event-teatro"
    ],
    "enabled": true,
    "preferences": {
      "interests": [
        "Música",
        "Gastronomía",
        "Arte",
        "Teatro",
        "Bienestar",
        "Comunidad"
      ],
      "city": "Todo Paraguay",
      "completed": true
    },
    "id": "qs-demo-v1-validator-nanduti",
    "name": "Acceso · Ñandutí Cultural",
    "email": "acceso.nanduti@demo.quesurge.test",
    "salt": "que-surge-demo-v1-salt-8",
    "passwordHash": "5a285b458d61a315af519265d8c67ee05758d29de09496276ff2a65fd76040e9"
  }
];

export const demoPurchases = [
  {
    "id": "qs-demo-v1-order-0",
    "eventId": "qs-demo-v1-event-jazz",
    "buyerId": "qs-demo-v1-buyer-ana",
    "typeId": "qs-demo-v1-event-jazz-general",
    "quantity": 3,
    "usedCount": 1
  },
  {
    "id": "qs-demo-v1-order-1",
    "eventId": "qs-demo-v1-event-sunset",
    "buyerId": "qs-demo-v1-buyer-luis",
    "typeId": "qs-demo-v1-event-sunset-vip",
    "quantity": 2,
    "usedCount": 0
  },
  {
    "id": "qs-demo-v1-order-2",
    "eventId": "qs-demo-v1-event-mesa",
    "buyerId": "qs-demo-v1-buyer-camila",
    "typeId": "qs-demo-v1-event-mesa-general",
    "quantity": 4,
    "usedCount": 1
  },
  {
    "id": "qs-demo-v1-order-3",
    "eventId": "qs-demo-v1-event-sabores",
    "buyerId": "qs-demo-v1-buyer-ana",
    "typeId": "qs-demo-v1-event-sabores-vip",
    "quantity": 2,
    "usedCount": 0
  },
  {
    "id": "qs-demo-v1-order-4",
    "eventId": "qs-demo-v1-event-arte",
    "buyerId": "qs-demo-v1-buyer-luis",
    "typeId": "qs-demo-v1-event-arte-general",
    "quantity": 3,
    "usedCount": 0
  },
  {
    "id": "qs-demo-v1-order-5",
    "eventId": "qs-demo-v1-event-teatro",
    "buyerId": "qs-demo-v1-buyer-camila",
    "typeId": "qs-demo-v1-event-teatro-vip",
    "quantity": 4,
    "usedCount": 1
  }
];
