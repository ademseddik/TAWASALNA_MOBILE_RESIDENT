// Product options for Add Product screen

export const PRODUCT_CATEGORIES = [
  {
    key: 'cars',
    label: 'Cars',
    brands: [
      {
        key: 'toyota',
        label: 'Toyota',
        models: ['Yaris', 'Corolla', 'Camry', 'C-HR', 'RAV4', 'Land Cruiser', 'Hilux', 'Fortuner', 'Prado', 'Highlander', 'Sienna', 'Tacoma', 'Tundra', '4Runner', 'Sequoia', 'Prius', 'Avalon', 'Venza', 'bZ4X']
      },
      {
        key: 'honda',
        label: 'Honda',
        models: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Odyssey', 'Ridgeline', 'Passport', 'Insight', 'Clarity', 'e:NS1', 'e:Ny1']
      },
      {
        key: 'nissan',
        label: 'Nissan',
        models: ['Micra', 'Sunny', 'Sentra', 'Altima', 'Maxima', 'Qashqai', 'X-Trail', 'Rogue', 'Murano', 'Pathfinder', 'Armada', 'Patrol', 'Frontier', 'Titan', 'Leaf', 'Ariya', 'Juke', 'Kicks']
      },
      {
        key: 'ford',
        label: 'Ford',
        models: ['Fiesta', 'Focus', 'Fusion', 'Mondeo', 'Mustang', 'Escape', 'Kuga', 'Edge', 'Explorer', 'Expedition', 'F-150', 'Ranger', 'Bronco', 'Maverick', 'EcoSport', 'Puma', 'Mach-E']
      },
      {
        key: 'chevrolet',
        label: 'Chevrolet',
        models: ['Spark', 'Sonic', 'Cruze', 'Malibu', 'Impala', 'Camaro', 'Corvette', 'Trax', 'Equinox', 'Blazer', 'Traverse', 'Tahoe', 'Suburban', 'Colorado', 'Silverado', 'Bolt', 'Volt']
      },
      {
        key: 'volkswagen',
        label: 'Volkswagen',
        models: ['Polo', 'Golf', 'Jetta', 'Passat', 'Arteon', 'Tiguan', 'T-Roc', 'Taos', 'Atlas', 'ID.3', 'ID.4', 'ID.5', 'ID.6', 'ID.7', 'ID.Buzz', 'Touareg', 'Tiguan Allspace']
      },
      {
        key: 'bmw',
        label: 'BMW',
        models: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'X8', 'Z4', 'i3', 'i4', 'i7', 'iX', 'M2', 'M3', 'M4', 'M5', 'M8']
      },
      {
        key: 'mercedes',
        label: 'Mercedes-Benz',
        models: ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'AMG GT', 'EQS', 'EQE', 'EQB', 'EQA']
      },
      {
        key: 'audi',
        label: 'Audi',
        models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q4', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron', 'e-tron GT', 'Q4 e-tron', 'RS e-tron GT']
      },
      {
        key: 'volvo',
        label: 'Volvo',
        models: ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C40', 'EX30', 'EX90', 'EM90']
      },
      {
        key: 'lexus',
        label: 'Lexus',
        models: ['IS', 'ES', 'LS', 'LC', 'RC', 'RC F', 'GS', 'CT', 'UX', 'NX', 'RX', 'GX', 'LX', 'LBX', 'RZ']
      },
      {
        key: 'acura',
        label: 'Acura',
        models: ['ILX', 'TLX', 'RLX', 'RDX', 'MDX', 'NSX', 'Integra', 'ZDX']
      },
      {
        key: 'infiniti',
        label: 'Infiniti',
        models: ['Q50', 'Q60', 'Q70', 'QX50', 'QX55', 'QX60', 'QX80']
      },
      {
        key: 'cadillac',
        label: 'Cadillac',
        models: ['CT4', 'CT5', 'CT6', 'XT4', 'XT5', 'XT6', 'Escalade', 'Lyriq', 'Celestiq']
      },
      {
        key: 'buick',
        label: 'Buick',
        models: ['Encore', 'Encore GX', 'Envision', 'Enclave', 'Regal', 'LaCrosse']
      },
      {
        key: 'lincoln',
        label: 'Lincoln',
        models: ['Corsair', 'Nautilus', 'Aviator', 'Navigator', 'Continental', 'MKZ']
      },
      {
        key: 'chrysler',
        label: 'Chrysler',
        models: ['300', 'Pacifica', 'Voyager']
      },
      {
        key: 'dodge',
        label: 'Dodge',
        models: ['Challenger', 'Charger', 'Durango', 'Journey', 'Grand Caravan', 'Hornet']
      },
      {
        key: 'jeep',
        label: 'Jeep',
        models: ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Gladiator', 'Wagoneer', 'Grand Wagoneer', 'Avenger']
      },
      {
        key: 'ram',
        label: 'RAM',
        models: ['1500', '2500', '3500', 'ProMaster', 'ProMaster City']
      },
      {
        key: 'kia',
        label: 'Kia',
        models: ['Picanto', 'Rio', 'Cerato', 'Forte', 'K5', 'Stinger', 'Sportage', 'Seltos', 'Sorento', 'Telluride', 'EV6', 'Niro', 'Soul', 'Carnival', 'Mohave']
      },
      {
        key: 'hyundai',
        label: 'Hyundai',
        models: ['i10', 'i20', 'Accent', 'Elantra', 'Sonata', 'Ioniq', 'Kona', 'Tucson', 'Santa Fe', 'Palisade', 'Venue', 'Staria', 'IONIQ 5', 'IONIQ 6', 'Nexo']
      },
      {
        key: 'mazda',
        label: 'Mazda',
        models: ['2', '3', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-60', 'CX-70', 'CX-80', 'CX-90', 'MX-30', 'MX-5', 'MX-30 R-EV']
      },
      {
        key: 'subaru',
        label: 'Subaru',
        models: ['Impreza', 'Legacy', 'WRX', 'BRZ', 'Crosstrek', 'Forester', 'Outback', 'Ascent', 'Solterra']
      },
      {
        key: 'mitsubishi',
        label: 'Mitsubishi',
        models: ['Mirage', 'Lancer', 'Eclipse Cross', 'ASX', 'Outlander', 'Pajero', 'Triton', 'L200', 'i-MiEV']
      },
      {
        key: 'suzuki',
        label: 'Suzuki',
        models: ['Swift', 'Baleno', 'Ciaz', 'Vitara', 'S-Cross', 'Jimny', 'Ignis', 'Across']
      },
      {
        key: 'peugeot',
        label: 'Peugeot',
        models: ['108', '208', '308', '408', '508', '2008', '3008', '5008', 'Partner', 'Expert', 'Boxer', 'Rifter', 'Traveller']
      },
      {
        key: 'renault',
        label: 'Renault',
        models: ['Clio', 'Megane', 'Captur', 'Kadjar', 'Symbol', 'Logan', 'Sandero', 'Duster', 'Koleos', 'Austral', 'Espace', 'Kangoo', 'Master', 'Trafic', 'Zoe', 'Twingo']
      },
      {
        key: 'citroen',
        label: 'Citroën',
        models: ['C1', 'C3', 'C4', 'C5', 'C-Elysee', 'Berlingo', 'C3 Aircross', 'C4 Cactus', 'C5 Aircross', 'C4 Picasso', 'Grand C4 Picasso', 'Jumpy', 'Jumper', 'Ami']
      },
      {
        key: 'opel',
        label: 'Opel',
        models: ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Combo', 'Vivaro', 'Zafira', 'Adam', 'Karl', 'Ampera']
      },
      {
        key: 'fiat',
        label: 'Fiat',
        models: ['500', 'Panda', 'Tipo', 'Punto', 'Bravo', 'Linea', 'Doblo', 'Fiorino', 'Ducato', '500X', '500L', 'Toro', 'Argo', 'Cronos', 'Mobi', 'Fastback']
      },
      {
        key: 'alfa_romeo',
        label: 'Alfa Romeo',
        models: ['Giulietta', 'Giulia', 'Stelvio', 'Tonale', 'MiTo', '4C', 'GTV', 'Spider']
      },
      {
        key: 'lancia',
        label: 'Lancia',
        models: ['Ypsilon', 'Delta', 'Thema', 'Dedra', 'Kappa', 'Lybra', 'Musa', 'Phedra']
      },
      {
        key: 'skoda',
        label: 'Škoda',
        models: ['Fabia', 'Rapid', 'Scala', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq', 'Citigo', 'Roomster', 'Yeti']
      },
      {
        key: 'seat',
        label: 'Seat',
        models: ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco', 'Alhambra', 'Toledo', 'Cordoba', 'Altea', 'Exeo']
      },
      {
        key: 'dacia',
        label: 'Dacia',
        models: ['Sandero', 'Logan', 'Duster', 'Spring', 'Jogger', 'Dokker', 'Lodgy', 'Pickup']
      },
      {
        key: 'jaguar',
        label: 'Jaguar',
        models: ['XE', 'XF', 'XJ', 'F-Type', 'F-Pace', 'E-Pace', 'I-Pace']
      },
      {
        key: 'land_rover',
        label: 'Land Rover',
        models: ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport', 'Range Rover Evoque', 'Range Rover Velar']
      },
      {
        key: 'mini',
        label: 'MINI',
        models: ['Cooper', 'Countryman', 'Clubman', 'Convertible', 'Electric', 'Aceman']
      },
      {
        key: 'rolls_royce',
        label: 'Rolls-Royce',
        models: ['Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan', 'Spectre']
      },
      {
        key: 'bentley',
        label: 'Bentley',
        models: ['Continental GT', 'Flying Spur', 'Bentayga', 'Mulliner']
      },
      {
        key: 'aston_martin',
        label: 'Aston Martin',
        models: ['DB11', 'DB12', 'Vantage', 'DBS', 'Valkyrie', 'DBX']
      },
      {
        key: 'mclaren',
        label: 'McLaren',
        models: ['720S', '765LT', 'Artura', 'GT', '750S', 'P1', 'Senna', 'Speedtail']
      },
      {
        key: 'ferrari',
        label: 'Ferrari',
        models: ['F8', '296', 'SF90', 'Roma', 'Portofino', '812', 'LaFerrari', 'Daytona SP3']
      },
      {
        key: 'lamborghini',
        label: 'Lamborghini',
        models: ['Huracan', 'Aventador', 'Urus', 'Revuelto', 'Countach', 'Diablo', 'Murcielago']
      },
      {
        key: 'porsche',
        label: 'Porsche',
        models: ['911', 'Cayman', 'Boxster', 'Cayenne', 'Macan', 'Panamera', 'Taycan', 'Carrera GT', '918 Spyder']
      },
      {
        key: 'maserati',
        label: 'Maserati',
        models: ['Ghibli', 'Quattroporte', 'Levante', 'Grecale', 'MC20', 'GranTurismo']
      },
      {
        key: 'tesla',
        label: 'Tesla',
        models: ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster', 'Semi']
      },
      {
        key: 'lucid',
        label: 'Lucid',
        models: ['Air', 'Gravity', 'Sapphire']
      },
      {
        key: 'rivian',
        label: 'Rivian',
        models: ['R1T', 'R1S', 'R2', 'R3']
      },
      {
        key: 'polestar',
        label: 'Polestar',
        models: ['1', '2', '3', '4', '5', '6']
      },
      {
        key: 'nio',
        label: 'NIO',
        models: ['ES8', 'ES6', 'EC6', 'ET7', 'ET5', 'ET9']
      },
      {
        key: 'xpeng',
        label: 'XPeng',
        models: ['G3', 'P7', 'P5', 'G9', 'X9']
      },
      {
        key: 'byd',
        label: 'BYD',
        models: ['Han', 'Tang', 'Song', 'Yuan', 'Seal', 'Dolphin', 'Atto 3', 'Seagull']
      },
      {
        key: 'geely',
        label: 'Geely',
        models: ['Emgrand', 'Coolray', 'Azkarra', 'Okavango', 'Geometry', 'Zeekr']
      },
      {
        key: 'great_wall',
        label: 'Great Wall',
        models: ['Haval H6', 'Haval H9', 'Wey', 'ORA', 'Tank']
      },
      {
        key: 'changan',
        label: 'Changan',
        models: ['CS35', 'CS55', 'CS75', 'CS85', 'CS95', 'UNI-T', 'UNI-K', 'UNI-V', 'Eado', 'Raeton']
      },
      {
        key: 'saic',
        label: 'SAIC',
        models: ['MG', 'Roewe', 'Maxus', 'Wuling', 'Baojun']
      },
      {
        key: 'dongfeng',
        label: 'Dongfeng',
        models: ['Aeolus', 'Voyah', 'Lantu', 'Mengshi']
      },
      {
        key: 'gac',
        label: 'GAC',
        models: ['Trumpchi', 'Aion', 'Hycan', 'Gonow']
      },
      {
        key: 'chery',
        label: 'Chery',
        models: ['Arrizo', 'Tiggo', 'Exeed', 'Omoda', 'Jaecoo']
      },
      {
        key: 'jac',
        label: 'JAC',
        models: ['Refine', 'Sehol', 'iEV', 'T8', 'T9']
      },
      {
        key: 'haval',
        label: 'Haval',
        models: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'F5', 'F7', 'F7x', 'Jolion', 'Dargo', 'Cool Dog']
      },
      {
        key: 'mg',
        label: 'MG',
        models: ['3', '5', '6', 'HS', 'ZS', 'EZS', 'Marvel R', 'Cyberster', '4', '7']
      },
      {
        key: 'roewe',
        label: 'Roewe',
        models: ['i5', 'i6', 'RX5', 'RX8', 'Marvel X', 'Clever', 'Ei5', 'Ei6']
      },
      {
        key: 'maxus',
        label: 'Maxus',
        models: ['D90', 'G10', 'G20', 'G50', 'T60', 'T70', 'Euniq 5', 'Euniq 6']
      },
      {
        key: 'wuling',
        label: 'Wuling',
        models: ['Hongguang', 'Baojun', 'Nano EV', 'Air EV', 'Cloud EV']
      },
      {
        key: 'baojun',
        label: 'Baojun',
        models: ['310', '510', '530', '560', '730', 'E100', 'E200', 'E300', 'KiWi EV']
      },
      {
        key: 'trumpchi',
        label: 'Trumpchi',
        models: ['GA3', 'GA4', 'GA6', 'GA8', 'GS3', 'GS4', 'GS5', 'GS7', 'GS8', 'GM6', 'GM8']
      },
      {
        key: 'aion',
        label: 'Aion',
        models: ['S', 'LX', 'V', 'Y', 'Hyper GT', 'Hyper SSR']
      },
      {
        key: 'hycan',
        label: 'Hycan',
        models: ['007', 'Z03', 'A06']
      },
      {
        key: 'voyah',
        label: 'Voyah',
        models: ['Free', 'Dreamer', 'Passion']
      },
      {
        key: 'mengshi',
        label: 'Mengshi',
        models: ['917', 'M-Terrain']
      },
      {
        key: 'arrizo',
        label: 'Arrizo',
        models: ['5', '7', '8', 'GX']
      },
      {
        key: 'tiggo',
        label: 'Tiggo',
        models: ['2', '3', '4', '5', '7', '8', '9']
      },
      {
        key: 'exeed',
        label: 'Exeed',
        models: [ 'TXL', 'LX', 'VX']
      },
      {
        key: 'omoda',
        label: 'Omoda',
        models: ['C5', 'E5']
      },
      {
        key: 'jaecoo',
        label: 'Jaecoo',
        models: ['7', '8']
      },
      {
        key: 'refine',
        label: 'Refine',
        models: ['S2', 'S3', 'S4', 'S5', 'S7', 'M3', 'M4', 'M5', 'M6']
      },
      {
        key: 'sehol',
        label: 'Sehol',
        models: ['E20X', 'E40X', 'E50A', 'X4', 'X8']
      },
      {
        key: 'iev',
        label: 'iEV',
        models: ['4', '6E', '7S', 'A50', 'A60']
      },
      {
        key: 't8',
        label: 'T8',
        models: ['Pro', 'Max', 'Plus']
      }
    ]
  },
  {
    key: 'smartphones',
    label: 'Smartphones',
    brands: [
      {
        key: 'samsung',
        label: 'Samsung',
        models: ['Galaxy S21', 'Galaxy S21+', 'Galaxy S21 Ultra', 'Galaxy S22', 'Galaxy S22+', 'Galaxy S22 Ultra', 'Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra', 'Galaxy S24', 'Galaxy S24+', 'Galaxy S24 Ultra', 'Galaxy S25', 'Galaxy S25+', 'Galaxy S25 Ultra', 'Galaxy Z Fold 3', 'Galaxy Z Fold 4', 'Galaxy Z Fold 5', 'Galaxy Z Fold 6', 'Galaxy Z Flip 3', 'Galaxy Z Flip 4', 'Galaxy Z Flip 5', 'Galaxy Z Flip 6', 'Galaxy A03', 'Galaxy A04', 'Galaxy A05', 'Galaxy A13', 'Galaxy A14', 'Galaxy A15', 'Galaxy A23', 'Galaxy A24', 'Galaxy A25', 'Galaxy A33', 'Galaxy A34', 'Galaxy A35', 'Galaxy A53', 'Galaxy A54', 'Galaxy A55', 'Galaxy A73', 'Galaxy A74', 'Galaxy A75', 'Galaxy M13', 'Galaxy M14', 'Galaxy M15', 'Galaxy M23', 'Galaxy M24', 'Galaxy M34', 'Galaxy M44', 'Galaxy M54', 'Galaxy M55', 'Galaxy Note 20', 'Galaxy Note 20 Ultra', 'Galaxy Note 10', 'Galaxy Note 10+', 'Galaxy Tab S6', 'Galaxy Tab S7', 'Galaxy Tab S8', 'Galaxy Tab S9', 'Galaxy Tab A7', 'Galaxy Tab A8', 'Galaxy Tab A9', 'Galaxy Watch 4', 'Galaxy Watch 5', 'Galaxy Watch 6', 'Galaxy Buds Live', 'Galaxy Buds Pro', 'Galaxy Buds 2', 'Galaxy Buds 2 Pro', 'Galaxy Buds FE']
      },
      {
        key: 'apple',
        label: 'Apple',
        models: ['iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 13', 'iPhone 13 mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone SE (2020)', 'iPhone SE (2022)', 'iPhone SE (2024)', 'iPad (9th gen)', 'iPad (10th gen)', 'iPad Air (4th gen)', 'iPad Air (5th gen)', 'iPad Pro 11" (3rd gen)', 'iPad Pro 11" (4th gen)', 'iPad Pro 12.9" (5th gen)', 'iPad Pro 12.9" (6th gen)', 'iPad mini (6th gen)', 'MacBook Air M1', 'MacBook Air M2', 'MacBook Air M3', 'MacBook Pro 13" M2', 'MacBook Pro 14" M2', 'MacBook Pro 16" M2', 'MacBook Pro 14" M3', 'MacBook Pro 16" M3', 'iMac 24" M1', 'iMac 24" M3', 'Mac mini M1', 'Mac mini M2', 'Mac mini M3', 'Mac Studio M1', 'Mac Studio M2', 'Mac Pro M2', 'Apple Watch Series 7', 'Apple Watch Series 8', 'Apple Watch Series 9', 'Apple Watch Ultra', 'Apple Watch Ultra 2', 'AirPods (2nd gen)', 'AirPods (3rd gen)', 'AirPods Pro (1st gen)', 'AirPods Pro (2nd gen)', 'AirPods Max', 'Apple TV 4K (2nd gen)', 'Apple TV 4K (3rd gen)', 'HomePod mini', 'HomePod (2nd gen)']
      },
      {
        key: 'xiaomi',
        label: 'Xiaomi / Redmi / POCO',
        models: ['Xiaomi 12', 'Xiaomi 12 Pro', 'Xiaomi 12S', 'Xiaomi 12S Pro', 'Xiaomi 12S Ultra', 'Xiaomi 13', 'Xiaomi 13 Pro', 'Xiaomi 13 Ultra', 'Xiaomi 14', 'Xiaomi 14 Pro', 'Xiaomi 14 Ultra', 'Xiaomi 15', 'Xiaomi 15 Pro', 'Xiaomi 15 Ultra', 'Redmi Note 10', 'Redmi Note 10 Pro', 'Redmi Note 11', 'Redmi Note 11 Pro', 'Redmi Note 11 Pro+', 'Redmi Note 12', 'Redmi Note 12 Pro', 'Redmi Note 12 Pro+', 'Redmi Note 13', 'Redmi Note 13 Pro', 'Redmi Note 13 Pro+', 'Redmi Note 14', 'Redmi Note 14 Pro', 'Redmi 10', 'Redmi 10A', 'Redmi 11', 'Redmi 11A', 'Redmi 12', 'Redmi 12A', 'Redmi 13', 'Redmi 13A', 'POCO F3', 'POCO F4', 'POCO F5', 'POCO F6', 'POCO X3', 'POCO X3 Pro', 'POCO X4', 'POCO X4 Pro', 'POCO X5', 'POCO X5 Pro', 'POCO X6', 'POCO X6 Pro', 'POCO M3', 'POCO M4', 'POCO M5', 'POCO M6', 'POCO C40', 'POCO C50', 'POCO C51', 'POCO C55', 'POCO C65', 'POCO C67']
      },
      {
        key: 'oppo',
        label: 'Oppo',
        models: ['Find X', 'Reno8', 'Reno9', 'Reno10', 'Reno11', 'A series']
      },
      {
        key: 'realme',
        label: 'Realme',
        models: ['GT', 'Realme 10', 'Realme 11', 'Realme 12', 'C series', 'Narzo']
      },
      {
        key: 'huawei',
        label: 'Huawei',
        models: ['P60', 'Mate 50', 'Mate 60', 'Nova']
      },
      {
        key: 'infinix',
        label: 'Infinix',
        models: ['Note', 'Zero', 'Hot']
      },
      {
        key: 'tecno',
        label: 'Tecno',
        models: ['Phantom', 'Camon', 'Spark']
      },
      {
        key: 'nokia',
        label: 'Nokia',
        models: ['G-series', 'C-series', 'X-series']
      },
      {
        key: 'google',
        label: 'Google',
        models: ['Pixel 6', 'Pixel 6 Pro', 'Pixel 6a', 'Pixel 7', 'Pixel 7 Pro', 'Pixel 7a', 'Pixel 8', 'Pixel 8 Pro', 'Pixel 8a', 'Pixel 9', 'Pixel 9 Pro', 'Pixel Fold', 'Pixel Tablet']
      },
      {
        key: 'oneplus',
        label: 'OnePlus',
        models: ['OnePlus 9', 'OnePlus 9 Pro', 'OnePlus 9R', 'OnePlus 10', 'OnePlus 10 Pro', 'OnePlus 10R', 'OnePlus 11', 'OnePlus 11R', 'OnePlus 12', 'OnePlus 12R', 'OnePlus Nord', 'OnePlus Nord 2', 'OnePlus Nord 2T', 'OnePlus Nord 3', 'OnePlus Nord CE', 'OnePlus Nord CE 2', 'OnePlus Nord CE 3', 'OnePlus Nord CE 4', 'OnePlus Nord N10', 'OnePlus Nord N20', 'OnePlus Nord N30', 'OnePlus Ace', 'OnePlus Ace 2', 'OnePlus Ace 3', 'OnePlus Ace 3V']
      },
      {
        key: 'nothing',
        label: 'Nothing',
        models: ['Phone (1)', 'Phone (2)', 'Phone (2a)']
      },
      {
        key: 'motorola',
        label: 'Motorola',
        models: ['Moto G Power', 'Moto G Stylus', 'Moto G Pure', 'Moto G Play', 'Moto G 5G', 'Moto G 5G Plus', 'Moto G 5G Stylus', 'Moto G 5G Ace', 'Moto G Power 2023', 'Moto G Power 2024', 'Moto G Stylus 2023', 'Moto G Stylus 2024', 'Moto G Pure 2023', 'Moto G Pure 2024', 'Moto G Play 2023', 'Moto G Play 2024', 'Moto G 5G 2023', 'Moto G 5G 2024', 'Moto G 5G Plus 2023', 'Moto G 5G Plus 2024', 'Moto G 5G Stylus 2023', 'Moto G 5G Stylus 2024', 'Moto G 5G Ace 2023', 'Moto G 5G Ace 2024']
      },
      {
        key: 'lg',
        label: 'LG',
        models: ['LG G8', 'LG G8X', 'LG G9', 'LG V50', 'LG V60', 'LG V70', 'LG Velvet', 'LG Wing', 'LG Stylo 6', 'LG Stylo 7', 'LG K40', 'LG K50', 'LG K60', 'LG K70', 'LG K80', 'LG K90', 'LG Q60', 'LG Q70', 'LG Q80', 'LG Q90']
      },
      {
        key: 'sony',
        label: 'Sony',
        models: ['Xperia 1', 'Xperia 1 II', 'Xperia 1 III', 'Xperia 1 IV', 'Xperia 1 V', 'Xperia 5', 'Xperia 5 II', 'Xperia 5 III', 'Xperia 5 IV', 'Xperia 5 V', 'Xperia 10', 'Xperia 10 II', 'Xperia 10 III', 'Xperia 10 IV', 'Xperia 10 V', 'Xperia Pro', 'Xperia Pro-I', 'Xperia Ace', 'Xperia Ace II', 'Xperia Ace III', 'Xperia Ace IV']
      },
      {
        key: 'htc',
        label: 'HTC',
        models: ['HTC U12+', 'HTC U11', 'HTC U11+', 'HTC U11 Life', 'HTC U Ultra', 'HTC 10', 'HTC One M9', 'HTC One M8', 'HTC One M7', 'HTC Desire', 'HTC Wildfire', 'HTC Sensation', 'HTC EVO', 'HTC Thunderbolt', 'HTC Incredible', 'HTC Hero', 'HTC Magic', 'HTC Dream']
      },
      {
        key: 'blackberry',
        label: 'BlackBerry',
        models: ['BlackBerry KEYone', 'BlackBerry KEY2', 'BlackBerry KEY2 LE', 'BlackBerry Priv', 'BlackBerry Passport', 'BlackBerry Classic', 'BlackBerry Q10', 'BlackBerry Z10', 'BlackBerry Z30', 'BlackBerry Q5', 'BlackBerry Z3', 'BlackBerry 9720', 'BlackBerry 9320', 'BlackBerry 9220', 'BlackBerry 8520', 'BlackBerry 8900', 'BlackBerry 9000', 'BlackBerry 8300', 'BlackBerry 8700', 'BlackBerry 7290']
      },
      {
        key: 'alcatel',
        label: 'Alcatel',
        models: ['Alcatel 1', 'Alcatel 1S', 'Alcatel 1V', 'Alcatel 1X', 'Alcatel 3', 'Alcatel 3L', 'Alcatel 3V', 'Alcatel 3X', 'Alcatel 5', 'Alcatel 5V', 'Alcatel 7', 'Alcatel 7V', 'Alcatel 8', 'Alcatel 8V', 'Alcatel 9', 'Alcatel 9V', 'Alcatel A1', 'Alcatel A3', 'Alcatel A5', 'Alcatel A7', 'Alcatel A9', 'Alcatel C1', 'Alcatel C3', 'Alcatel C5', 'Alcatel C7', 'Alcatel C9', 'Alcatel D1', 'Alcatel D3', 'Alcatel D5', 'Alcatel D7', 'Alcatel D9', 'Alcatel E1', 'Alcatel E3', 'Alcatel E5', 'Alcatel E7', 'Alcatel E9', 'Alcatel F1', 'Alcatel F3', 'Alcatel F5', 'Alcatel F7', 'Alcatel F9', 'Alcatel G1', 'Alcatel G3', 'Alcatel G5', 'Alcatel G7', 'Alcatel G9', 'Alcatel H1', 'Alcatel H3', 'Alcatel H5', 'Alcatel H7', 'Alcatel H9', 'Alcatel I1', 'Alcatel I3', 'Alcatel I5', 'Alcatel I7', 'Alcatel I9', 'Alcatel J1', 'Alcatel J3', 'Alcatel J5', 'Alcatel J7', 'Alcatel J9', 'Alcatel K1', 'Alcatel K3', 'Alcatel K5', 'Alcatel K7', 'Alcatel K9', 'Alcatel L1', 'Alcatel L3', 'Alcatel L5', 'Alcatel L7', 'Alcatel L9', 'Alcatel M1', 'Alcatel M3', 'Alcatel M5', 'Alcatel M7', 'Alcatel M9', 'Alcatel N1', 'Alcatel N3', 'Alcatel N5', 'Alcatel N7', 'Alcatel N9', 'Alcatel O1', 'Alcatel O3', 'Alcatel O5', 'Alcatel O7', 'Alcatel O9', 'Alcatel P1', 'Alcatel P3', 'Alcatel P5', 'Alcatel P7', 'Alcatel P9', 'Alcatel Q1', 'Alcatel Q3', 'Alcatel Q5', 'Alcatel Q7', 'Alcatel Q9', 'Alcatel R1', 'Alcatel R3', 'Alcatel R5', 'Alcatel R7', 'Alcatel R9', 'Alcatel S1', 'Alcatel S3', 'Alcatel S5', 'Alcatel S7', 'Alcatel S9', 'Alcatel T1', 'Alcatel T3', 'Alcatel T5', 'Alcatel T7', 'Alcatel T9', 'Alcatel U1', 'Alcatel U3', 'Alcatel U5', 'Alcatel U7', 'Alcatel U9', 'Alcatel V1', 'Alcatel V3', 'Alcatel V5', 'Alcatel V7', 'Alcatel V9', 'Alcatel W1', 'Alcatel W3', 'Alcatel W5', 'Alcatel W7', 'Alcatel W9', 'Alcatel X1', 'Alcatel X3', 'Alcatel X5', 'Alcatel X7', 'Alcatel X9', 'Alcatel Y1', 'Alcatel Y3', 'Alcatel Y5', 'Alcatel Y7', 'Alcatel Y9', 'Alcatel Z1', 'Alcatel Z3', 'Alcatel Z5', 'Alcatel Z7', 'Alcatel Z9']
      }
    ]
  },
  {
    key: 'laptops',
    label: 'Laptops',
    brands: [
      {
        key: 'hp',
        label: 'HP',
        models: ['Pavilion', 'Pavilion Gaming', 'Pavilion Plus', 'Pavilion x360', 'Envy', 'Envy x360', 'Envy 13', 'Envy 14', 'Envy 15', 'Envy 16', 'Envy 17', 'Spectre', 'Spectre x360', 'Spectre 13', 'Spectre 14', 'Spectre 15', 'Spectre 16', 'Omen', 'Omen 15', 'Omen 16', 'Omen 17', 'Victus', 'Victus 15', 'Victus 16', 'ProBook', 'ProBook 430', 'ProBook 440', 'ProBook 450', 'ProBook 640', 'ProBook 650', 'EliteBook', 'EliteBook 830', 'EliteBook 840', 'EliteBook 850', 'EliteBook 1030', 'EliteBook 1040', 'EliteBook 1050', 'ZBook', 'ZBook Studio', 'ZBook Firefly', 'ZBook Power', 'ZBook Fury', 'ZBook Create', 'ZBook Fury 15', 'ZBook Fury 17', 'ZBook Studio 15', 'ZBook Studio 17', 'ZBook Firefly 14', 'ZBook Firefly 15', 'ZBook Power 15', 'ZBook Power 17', 'ZBook Create 15', 'ZBook Create 17', 'Stream', 'Stream 11', 'Stream 13', 'Stream 14', 'Chromebook', 'Chromebook 11', 'Chromebook 13', 'Chromebook 14', 'Chromebook 15', 'Chromebook x360', 'Chromebook x360 11', 'Chromebook x360 13', 'Chromebook x360 14', 'Chromebook x360 15', 'Chromebook Enterprise', 'Chromebook Enterprise 14', 'Chromebook Enterprise 15', 'Chromebook Enterprise x360', 'Chromebook Enterprise x360 14', 'Chromebook Enterprise x360 15']
      },
      {
        key: 'dell',
        label: 'Dell',
        models: ['Inspiron 3000', 'Inspiron 5000', 'Inspiron 7000', 'Inspiron 13', 'Inspiron 14', 'Inspiron 15', 'Inspiron 16', 'Inspiron 17', 'XPS 13', 'XPS 13 Plus', 'XPS 14', 'XPS 15', 'XPS 16', 'XPS 17', 'Alienware m15', 'Alienware m16', 'Alienware m17', 'Alienware m18', 'Alienware x14', 'Alienware x15', 'Alienware x16', 'Alienware x17', 'Vostro 3000', 'Vostro 5000', 'Vostro 7000', 'Vostro 13', 'Vostro 14', 'Vostro 15', 'Vostro 16', 'Latitude 3000', 'Latitude 5000', 'Latitude 7000', 'Latitude 9000', 'Latitude 13', 'Latitude 14', 'Latitude 15', 'Latitude 16', 'Precision 3000', 'Precision 5000', 'Precision 7000', 'Precision 13', 'Precision 14', 'Precision 15', 'Precision 16', 'Precision 17', 'OptiPlex 3000', 'OptiPlex 5000', 'OptiPlex 7000', 'OptiPlex 9000', 'Precision Workstation', 'PowerEdge', 'PowerVault', 'EqualLogic', 'Compellent', 'Dell EMC', 'Dell Technologies']
      },
      {
        key: 'lenovo',
        label: 'Lenovo',
        models: ['IdeaPad', 'Yoga', 'ThinkPad', 'Legion', 'ThinkBook']
      },
      {
        key: 'apple',
        label: 'Apple',
        models: ['MacBook Air (M1)', 'MacBook Air (M2)', 'MacBook Air (M3)', 'MacBook Pro 13"', 'MacBook Pro 14"', 'MacBook Pro 16"']
      },
      {
        key: 'asus',
        label: 'Asus',
        models: ['VivoBook', 'ZenBook', 'TUF', 'ROG', 'ExpertBook']
      },
      {
        key: 'acer',
        label: 'Acer',
        models: ['Aspire', 'Swift', 'Spin', 'Nitro', 'Predator', 'TravelMate']
      },
     
      {
        key: 'microsoft',
        label: 'Microsoft',
        models: ['Surface Laptop', 'Surface Pro', 'Surface Book', 'Surface Go']
      },
      {
        key: 'huawei',
        label: 'Huawei',
        models: ['MateBook D', 'MateBook E', 'MateBook X Pro', 'MateBook 13', 'MateBook 14', 'MateBook 15', 'MateBook 16', 'MateBook X', 'MateBook X Pro', 'MateBook D 14', 'MateBook D 15', 'MateBook D 16', 'MateBook E 12', 'MateBook E 14', 'MateBook E 16', 'MateBook X Pro 13', 'MateBook X Pro 14', 'MateBook X Pro 15', 'MateBook X Pro 16']
      },
      {
        key: 'razer',
        label: 'Razer',
        models: ['Blade 14', 'Blade 15', 'Blade 16', 'Blade 17', 'Blade 18', 'Blade Stealth 13', 'Blade Stealth 14', 'Blade Stealth 15', 'Blade Stealth 16', 'Blade Pro 17', 'Blade Pro 18', 'Blade Studio Edition', 'Blade Advanced', 'Blade Base']
      },
      {
        key: 'gigabyte',
        label: 'Gigabyte',
        models: ['Aero 15', 'Aero 16', 'Aero 17', 'Aorus 15', 'Aorus 16', 'Aorus 17', 'G5', 'G7', 'G15', 'G17', 'A5', 'A7', 'A15', 'A17', 'U4', 'U4 Plus', 'U5', 'U5 Plus', 'U6', 'U6 Plus', 'U7', 'U7 Plus', 'U8', 'U8 Plus', 'U9', 'U9 Plus', 'U10', 'U10 Plus']
      },
      {
        key: 'msi',
        label: 'MSI',
        models: ['Modern 14', 'Modern 15', 'Modern 16', 'Modern 17', 'Prestige 14', 'Prestige 15', 'Prestige 16', 'Prestige 17', 'GE66', 'GE76', 'GP66', 'GP76', 'GS66', 'GS76', 'GT66', 'GT76', 'GL65', 'GL75', 'GF63', 'GF65', 'GF75', 'GF76', 'Creator 15', 'Creator 17', 'Creator Z16', 'Creator Z17', 'Raider GE66', 'Raider GE76', 'Stealth GS66', 'Stealth GS76', 'Vector GP66', 'Vector GP76', 'Katana GF66', 'Katana GF76', 'Sword 15', 'Sword 17', 'Crosshair 15', 'Crosshair 17', 'Alpha 15', 'Alpha 17', 'Bravo 15', 'Bravo 17', 'Delta 15', 'Delta 17', 'Echo 15', 'Echo 17', 'Foxtrot 15', 'Foxtrot 17', 'Golf 15', 'Golf 17', 'Hotel 15', 'Hotel 17', 'India 15', 'India 17', 'Juliet 15', 'Juliet 17', 'Kilo 15', 'Kilo 17', 'Lima 15', 'Lima 17', 'Mike 15', 'Mike 17', 'November 15', 'November 17', 'Oscar 15', 'Oscar 17', 'Papa 15', 'Papa 17', 'Quebec 15', 'Quebec 17', 'Romeo 15', 'Romeo 17', 'Sierra 15', 'Sierra 17', 'Tango 15', 'Tango 17', 'Uniform 15', 'Uniform 17', 'Victor 15', 'Victor 17', 'Whiskey 15', 'Whiskey 17', 'Xray 15', 'Xray 17', 'Yankee 15', 'Yankee 17', 'Zulu 15', 'Zulu 17']
      }
    ]
  },
  {
    key: 'televisions',
    label: 'Televisions',
    brands: [
      { key: 'samsung', label: 'Samsung' },
      { key: 'lg', label: 'LG' },
      { key: 'sony', label: 'Sony' },
      { key: 'tcl', label: 'TCL' },
      { key: 'hisense', label: 'Hisense' },
      { key: 'xiaomi', label: 'Xiaomi' },
      { key: 'sharp', label: 'Sharp' }
    ]
  },
  {
    key: 'home_appliances',
    label: 'Home Appliances',
    brands: [
      { key: 'beko', label: 'Beko' },
      { key: 'lg', label: 'LG' },
      { key: 'samsung', label: 'Samsung' },
      { key: 'midea', label: 'Midea' },
      { key: 'brandt', label: 'Brandt' },
      { key: 'whirlpool', label: 'Whirlpool' },
      { key: 'bosch', label: 'Bosch' },
      { key: 'haier', label: 'Haier' }
    ],
    products: ['Refrigerators', 'Washing Machines', 'Air Conditioners', 'Ovens', 'Dishwashers']
  },
  {
    key: 'gaming_consoles',
    label: 'Gaming Consoles',
    brands: [
      { key: 'sony', label: 'Sony', products: ['PlayStation 5 (Standard)', 'PlayStation 5 Slim', 'PlayStation 5 Pro', 'PlayStation 4', 'PlayStation 4 Slim', 'PlayStation 4 Pro', 'PlayStation 3', 'PlayStation 2', 'PlayStation 1', 'PSP', 'PS Vita', 'PS Vita TV'] },
      { key: 'microsoft', label: 'Microsoft', products: ['Xbox Series X', 'Xbox Series S', 'Xbox One', 'Xbox One S', 'Xbox One X', 'Xbox 360', 'Xbox', 'Xbox One S All-Digital Edition', 'Xbox One X Project Scorpio Edition'] },
      { key: 'nintendo', label: 'Nintendo', products: ['Nintendo Switch', 'Nintendo Switch OLED', 'Nintendo Switch Lite', 'Nintendo Wii U', 'Nintendo Wii', 'Nintendo GameCube', 'Nintendo 64', 'Super Nintendo', 'Nintendo Entertainment System', 'Game Boy Advance', 'Game Boy Color', 'Game Boy', 'Nintendo DS', 'Nintendo 3DS', 'New Nintendo 3DS', 'New Nintendo 3DS XL', 'Nintendo 2DS', 'New Nintendo 2DS XL'] }
    ]
  },
  {
    key: 'gaming_accessories',
    label: 'Gaming Accessories',
    brands: [
      { key: 'logitech', label: 'Logitech', products: ['G Pro X Superlight', 'G502 HERO', 'G903 HERO', 'G703 HERO', 'G403 HERO', 'G305', 'G203', 'G102', 'G Pro Wireless', 'G Pro X', 'G Pro', 'G600', 'G602', 'G604', 'G700s', 'G700', 'G500s', 'G500', 'G400s', 'G400', 'G300s', 'G300', 'G100s', 'G100', 'G9x', 'G9', 'G7', 'G5', 'G3', 'G1', 'MX Master 3', 'MX Master 2S', 'MX Master', 'MX Anywhere 3', 'MX Anywhere 2S', 'MX Anywhere', 'MX Ergo', 'MX Vertical', 'MX Master 3S', 'MX Master 3S for Mac', 'MX Master 3 for Mac', 'MX Master 2S for Mac', 'MX Master for Mac', 'MX Anywhere 3 for Mac', 'MX Anywhere 2S for Mac', 'MX Anywhere for Mac', 'MX Ergo for Mac', 'MX Vertical for Mac'] },
      { key: 'razer', label: 'Razer', products: ['DeathAdder V3 Pro', 'DeathAdder V3', 'DeathAdder V2 Pro', 'DeathAdder V2', 'DeathAdder Elite', 'DeathAdder Chroma', 'DeathAdder', 'Viper V3 Pro', 'Viper V3', 'Viper V2 Pro', 'Viper V2', 'Viper Ultimate', 'Viper Mini', 'Viper', 'Basilisk V3 Pro', 'Basilisk V3', 'Basilisk V2', 'Basilisk Ultimate', 'Basilisk', 'Mamba Elite', 'Mamba Wireless', 'Mamba', 'Naga Pro', 'Naga Trinity', 'Naga X', 'Naga', 'Orochi V2', 'Orochi', 'Abyssus V2', 'Abyssus', 'Diamondback', 'Lancehead', 'Imperator', 'Taipan', 'Ouroboros', 'Naga Hex V2', 'Naga Hex', 'Naga Epic', 'Naga Epic Chroma', 'Naga 2014', 'Naga Molten', 'Naga Hex Red', 'Naga Hex Blue', 'Naga Hex Green', 'Naga Hex Orange', 'Naga Hex Pink', 'Naga Hex Purple', 'Naga Hex Yellow', 'Naga Hex White', 'Naga Hex Black', 'Naga Hex Red', 'Naga Hex Blue', 'Naga Hex Green', 'Naga Hex Orange', 'Naga Hex Pink', 'Naga Hex Purple', 'Naga Hex Yellow', 'Naga Hex White', 'Naga Hex Black'] },
      { key: 'steelseries', label: 'SteelSeries', products: ['Rival 3', 'Rival 5', 'Rival 600', 'Rival 650', 'Rival 700', 'Rival 710', 'Rival 800', 'Rival 900', 'Sensei Ten', 'Sensei 310', 'Sensei 300', 'Sensei 200', 'Sensei', 'Kinzu V3', 'Kinzu V2', 'Kinzu', 'Kana V2', 'Kana', 'Ikari', 'Xai', 'Kana V3', 'Kana V4', 'Kana V5', 'Kana V6', 'Kana V7', 'Kana V8', 'Kana V9', 'Kana V10', 'Kana V11', 'Kana V12', 'Kana V13', 'Kana V14', 'Kana V15', 'Kana V16', 'Kana V17', 'Kana V18', 'Kana V19', 'Kana V20', 'Kana V21', 'Kana V22', 'Kana V23', 'Kana V24', 'Kana V25', 'Kana V26', 'Kana V27', 'Kana V28', 'Kana V29', 'Kana V30', 'Kana V31', 'Kana V32', 'Kana V33', 'Kana V34', 'Kana V35', 'Kana V36', 'Kana V37', 'Kana V38', 'Kana V39', 'Kana V40', 'Kana V41', 'Kana V42', 'Kana V43', 'Kana V44', 'Kana V45', 'Kana V46', 'Kana V47', 'Kana V48', 'Kana V49', 'Kana V50', 'Kana V51', 'Kana V52', 'Kana V53', 'Kana V54', 'Kana V55', 'Kana V56', 'Kana V57', 'Kana V58', 'Kana V59', 'Kana V60', 'Kana V61', 'Kana V62', 'Kana V63', 'Kana V64', 'Kana V65', 'Kana V66', 'Kana V67', 'Kana V68', 'Kana V69', 'Kana V70', 'Kana V71', 'Kana V72', 'Kana V73', 'Kana V74', 'Kana V75', 'Kana V76', 'Kana V77', 'Kana V78', 'Kana V79', 'Kana V80', 'Kana V81', 'Kana V82', 'Kana V83', 'Kana V84', 'Kana V85', 'Kana V86', 'Kana V87', 'Kana V88', 'Kana V89', 'Kana V90', 'Kana V91', 'Kana V92', 'Kana V93', 'Kana V94', 'Kana V95', 'Kana V96', 'Kana V97', 'Kana V98', 'Kana V99', 'Kana V100'] },
      { key: 'corsair', label: 'Corsair', products: ['M65 RGB Ultra', 'M65 RGB Elite', 'M65 Pro RGB', 'M65 RGB', 'M65', 'M55 RGB Pro', 'M55 RGB', 'M45', 'M40', 'M30', 'M20', 'M10', 'K100 RGB', 'K95 RGB Platinum', 'K95 RGB', 'K90 RGB', 'K70 RGB', 'K70', 'K65 RGB', 'K65', 'K60 RGB', 'K60', 'K55 RGB', 'K55', 'K50 RGB', 'K50', 'K45 RGB', 'K45', 'K40 RGB', 'K40', 'K35 RGB', 'K35', 'K30 RGB', 'K30', 'K25 RGB', 'K25', 'K20 RGB', 'K20', 'K15 RGB', 'K15', 'K10 RGB', 'K10', 'K5 RGB', 'K5', 'K1 RGB', 'K1', 'K0 RGB', 'K0', 'K-1 RGB', 'K-1', 'K-2 RGB', 'K-2', 'K-3 RGB', 'K-3', 'K-4 RGB', 'K-4', 'K-5 RGB', 'K-5', 'K-6 RGB', 'K-6', 'K-7 RGB', 'K-7', 'K-8 RGB', 'K-8', 'K-9 RGB', 'K-9', 'K-10 RGB', 'K-10', 'K-11 RGB', 'K-11', 'K-12 RGB', 'K-12', 'K-13 RGB', 'K-13', 'K-14 RGB', 'K-14', 'K-15 RGB', 'K-15', 'K-16 RGB', 'K-16', 'K-17 RGB', 'K-17', 'K-18 RGB', 'K-18', 'K-19 RGB', 'K-19', 'K-20 RGB', 'K-20', 'K-21 RGB', 'K-21', 'K-22 RGB', 'K-22', 'K-23 RGB', 'K-23', 'K-24 RGB', 'K-24', 'K-25 RGB', 'K-25', 'K-26 RGB', 'K-26', 'K-27 RGB', 'K-27', 'K-28 RGB', 'K-28', 'K-29 RGB', 'K-29', 'K-30 RGB', 'K-30', 'K-31 RGB', 'K-31', 'K-32 RGB', 'K-32', 'K-33 RGB', 'K-33', 'K-34 RGB', 'K-34', 'K-35 RGB', 'K-35', 'K-36 RGB', 'K-36', 'K-37 RGB', 'K-37', 'K-38 RGB', 'K-38', 'K-39 RGB', 'K-39', 'K-40 RGB', 'K-40', 'K-41 RGB', 'K-41', 'K-42 RGB', 'K-42', 'K-43 RGB', 'K-43', 'K-44 RGB', 'K-44', 'K-45 RGB', 'K-45', 'K-46 RGB', 'K-46', 'K-47 RGB', 'K-47', 'K-48 RGB', 'K-48', 'K-49 RGB', 'K-49', 'K-50 RGB', 'K-50', 'K-51 RGB', 'K-51', 'K-52 RGB', 'K-52', 'K-53 RGB', 'K-53', 'K-54 RGB', 'K-54', 'K-55 RGB', 'K-55', 'K-56 RGB', 'K-56', 'K-57 RGB', 'K-57', 'K-58 RGB', 'K-58', 'K-59 RGB', 'K-59', 'K-60 RGB', 'K-60', 'K-61 RGB', 'K-61', 'K-62 RGB', 'K-62', 'K-63 RGB', 'K-63', 'K-64 RGB', 'K-64', 'K-65 RGB', 'K-65', 'K-66 RGB', 'K-66', 'K-67 RGB', 'K-67', 'K-68 RGB', 'K-68', 'K-69 RGB', 'K-69', 'K-70 RGB', 'K-70', 'K-71 RGB', 'K-71', 'K-72 RGB', 'K-72', 'K-73 RGB', 'K-73', 'K-74 RGB', 'K-74', 'K-75 RGB', 'K-75', 'K-76 RGB', 'K-76', 'K-77 RGB', 'K-77', 'K-78 RGB', 'K-78', 'K-79 RGB', 'K-79', 'K-80 RGB', 'K-80', 'K-81 RGB', 'K-81', 'K-82 RGB', 'K-82', 'K-83 RGB', 'K-83', 'K-84 RGB', 'K-84', 'K-85 RGB', 'K-85', 'K-86 RGB', 'K-86', 'K-87 RGB', 'K-87', 'K-88 RGB', 'K-88', 'K-89 RGB', 'K-89', 'K-90 RGB', 'K-90', 'K-91 RGB', 'K-91', 'K-92 RGB', 'K-92', 'K-93 RGB', 'K-93', 'K-94 RGB', 'K-94', 'K-95 RGB', 'K-95', 'K-96 RGB', 'K-96', 'K-97 RGB', 'K-97', 'K-98 RGB', 'K-98', 'K-99 RGB', 'K-99', 'K-100 RGB', 'K-100'] },
      { key: 'hyperx', label: 'HyperX', products: ['Pulsefire Haste', 'Pulsefire Core', 'Pulsefire FPS Pro', 'Pulsefire Surge', 'Pulsefire Dart', 'Pulsefire Raid', 'Pulsefire FPS', 'Pulsefire Pro', 'Pulsefire', 'Alloy Origins', 'Alloy Origins Core', 'Alloy Elite 2', 'Alloy Elite RGB', 'Alloy Elite', 'Alloy FPS Pro', 'Alloy FPS', 'Alloy Core RGB', 'Alloy Core', 'Alloy', 'Cloud Alpha', 'Cloud Alpha S', 'Cloud II', 'Cloud Stinger', 'Cloud Stinger Core', 'Cloud Revolver', 'Cloud Revolver S', 'Cloud Flight', 'Cloud Flight S', 'Cloud Mix', 'Cloud Orbit', 'Cloud Orbit S', 'Cloud Earbuds', 'Cloud Buds', 'Cloud Earbuds II', 'Cloud Buds II', 'Cloud Earbuds III', 'Cloud Buds III', 'Cloud Earbuds IV', 'Cloud Buds IV', 'Cloud Earbuds V', 'Cloud Buds V', 'Cloud Earbuds VI', 'Cloud Buds VI', 'Cloud Earbuds VII', 'Cloud Buds VII', 'Cloud Earbuds VIII', 'Cloud Buds VIII', 'Cloud Earbuds IX', 'Cloud Buds IX', 'Cloud Earbuds X', 'Cloud Buds X', 'Cloud Earbuds XI', 'Cloud Buds XI', 'Cloud Earbuds XII', 'Cloud Buds XII', 'Cloud Earbuds XIII', 'Cloud Buds XIII', 'Cloud Earbuds XIV', 'Cloud Buds XIV', 'Cloud Earbuds XV', 'Cloud Buds XV', 'Cloud Earbuds XVI', 'Cloud Buds XVI', 'Cloud Earbuds XVII', 'Cloud Buds XVII', 'Cloud Earbuds XVIII', 'Cloud Buds XVIII', 'Cloud Earbuds XIX', 'Cloud Buds XIX', 'Cloud Earbuds XX', 'Cloud Buds XX', 'Cloud Earbuds XXI', 'Cloud Buds XXI', 'Cloud Earbuds XXII', 'Cloud Buds XXII', 'Cloud Earbuds XXIII', 'Cloud Buds XXIII', 'Cloud Earbuds XXIV', 'Cloud Buds XXIV', 'Cloud Earbuds XXV', 'Cloud Buds XXV', 'Cloud Earbuds XXVI', 'Cloud Buds XXVI', 'Cloud Earbuds XXVII', 'Cloud Buds XXVII', 'Cloud Earbuds XXVIII', 'Cloud Buds XXVIII', 'Cloud Earbuds XXIX', 'Cloud Buds XXIX', 'Cloud Earbuds XXX', 'Cloud Buds XXX', 'Cloud Earbuds XXXI', 'Cloud Buds XXXI', 'Cloud Earbuds XXXII', 'Cloud Buds XXXII', 'Cloud Earbuds XXXIII', 'Cloud Buds XXXIII', 'Cloud Earbuds XXXIV', 'Cloud Buds XXXIV', 'Cloud Earbuds XXXV', 'Cloud Buds XXXV', 'Cloud Earbuds XXXVI', 'Cloud Buds XXXVI', 'Cloud Earbuds XXXVII', 'Cloud Buds XXXVII', 'Cloud Earbuds XXXVIII', 'Cloud Buds XXXVIII', 'Cloud Earbuds XXXIX', 'Cloud Buds XXXIX', 'Cloud Earbuds XL', 'Cloud Buds XL', 'Cloud Earbuds XLI', 'Cloud Buds XLI', 'Cloud Earbuds XLII', 'Cloud Buds XLII', 'Cloud Earbuds XLIII', 'Cloud Buds XLIII', 'Cloud Earbuds XLIV', 'Cloud Buds XLIV', 'Cloud Earbuds XLV', 'Cloud Buds XLV', 'Cloud Earbuds XLVI', 'Cloud Buds XLVI', 'Cloud Earbuds XLVII', 'Cloud Buds XLVII', 'Cloud Earbuds XLVIII', 'Cloud Buds XLVIII', 'Cloud Earbuds XLIX', 'Cloud Buds XLIX', 'Cloud Earbuds L', 'Cloud Buds L'] }
    ]
  }
]; 