
# Snowflakes

Добавляет на сайт **новогоднее настроение**, а точнее снегопад, сугробы и машинку, которая их регулярно убирает!

**⚠️ Код никак не изменяет другие файлы и не влияет на работу сайта.
Однако, перед установкой скрипта рекомендуем создать резервную копию базы данных и всех файлов.**

- [Snowflakes](#snowflakes)
  - [Демо](#демо)
  - [Установка](#установка)
    - [Если загружаем файлы к себе на сервер](#если-загружаем-файлы-к-себе-на-сервер)
    - [Если подключаем удаленный скрипт](#если-подключаем-удаленный-скрипт)
  - [Настройка](#настройка)

## Демо

- [Снегопад](https://morfeisys.github.io/snowflakes/examples/snowflakes.html)
- [Снегопад и сугробы](https://morfeisys.github.io/snowflakes/examples/snowflakes-with-snow-balls.html)

## Установка

### Если загружаем файлы к себе на сервер

1. [Скачать](https://github.com/MorfeiSYS/snowflakes/releases) и распаковать архив.
2. Загрузить папку с файлами себе на хостинг.
3. Подключить css-стили и js-скрипт:

ПЕРЕД закрывающим тегом `</head>` вставить строку:

```html
    <link href="/snowFlakes/snow.min.css" rel="stylesheet">
```

ПОСЛЕ открывающего тега `<body>` вставить строки:

```html
    <script src="/snowFlakes/Snow.js"></script>
    <script>
        new Snow();
    </script>
```

Очистить кеш в настройках вашей CMS-системы (опционально).

**Сборка `dist` после изменений в `lib/`:** `npm run build` (нужны Node.js и `npm install`) или без Node: `npm run build:dist` / `powershell -File scripts/build-dist.ps1`.

_____

### Если подключаем удаленный скрипт

1. Подключаем только css-стили и js-скрипт.

ПЕРЕД закрывающим тегом `</head>` вставить строку:

```html
    <link href="https://cdn.jsdelivr.net/gh/MorfeiSYS/snowflakes/dist/snow.min.css" rel="stylesheet">
```

ПОСЛЕ открывающего тега `<body>` вставить строку:

```html
    <script src="https://cdn.jsdelivr.net/gh/MorfeiSYS/snowflakes/dist/Snow.min.js"></script>
    <script>
        new Snow();
    </script>
```

Очистить кеш в настройках вашей CMS-системы (опционально).

## Настройка

Список переменных, чтобы настроить все так, как вам нравится!  

| Параметр                   | Значение | По умолчанию | Описание                                                                      |
| -------------------------- | -------- | ------------ | ----------------------------------------------------------------------------- |
| iconColor                  | string   | #a6e7ff      | Цвет снежинки                                                                 |
| iconSize                   | number   | 15           | Размер снежинки                                                               |
| icon                       | string   | svg          | Изображение снежинки (если указать, то iconColor, iconSize работать не будут) |
| snowPlowImage              | string   | svg          | Изображение снегоуборочной машины                                             |
| showSnowBalls              | bool     | true         | Включить сугробы                                                              |
| showSnowBallsIsMobile      | bool     | true         | Включить на устройствах < 1024px                                              |
| showSnowflakes             | bool     | true         | Включить снегопад                                                             |
| countSnowflake             | number   | 100          | Кол-во снежинок (0-100)                                                       |
| snowBallsLength            | number   | 10           | Кол-во сугробов (0-10)                                                        |
| snowBallIterations         | number   | 40           | Кол-во итераций роста сугроба (10-40)                                         |
| snowBallupNum              | number   | 1            | Кол-во пикселей роста сугроба за одну итерацию (1-3)                          |
| snowBallIterationsInterval | number   | 1000         | Скорость роста сугроба в **миллисекундах**                                    |
| clearSnowBalls             | number   | 20000        | Интервал очищения в **миллисекундах**                                         |
| countRaindrop              | number   | 120          | Кол-во капель дождя (0–200); только при режиме **rain** / **sleet**           |
| countRaindrops             | number   | —            | Синоним `countRaindrop`                                                       |
| precipitationMode          | string   | —            | Принудительно: `none` \| `rain` \| `snow` \| `sleet` (без API)                |
| rainIconColor              | string   | #7eb8e8      | Цвет капель дождя                                                             |

### Погода (WeatherAPI / OpenWeatherMap)

Если включить блок `weather`, эффекты на странице зависят от прогноза для указанного города:

| Режим   | На странице                          | Сугробы | Снегоуборочная машина      |
| ------- | ------------------------------------ | ------- | -------------------------- |
| `snow`  | снегопад                             | да      | да, после роста сугробов   |
| `rain`  | дождь                                | нет     | нет                        |
| `sleet` | снег + дождь (мокрый снег)           | да      | да, после роста сугробов   |
| `none`  | без осадков                          | нет     | нет                        |

Без `weather.enabled` поведение как раньше: всегда снег и сугробы (если не отключены вручную).

**Важно:** ключ API нельзя безопасно хранить в открытом JS на продакшене — лучше проксировать запрос через свой backend.

```javascript
new Snow({
  weather: {
    enabled: true,
    provider: 'weatherapi', // или 'openweathermap'
    apiKey: 'YOUR_KEY',
    city: 'Moscow',
    // lat: 55.75, lon: 37.61,  // вместо city
    scope: 'now', // 'now' — сейчас идут осадки; 'today' — осадки в прогнозе на сегодня
    refreshInterval: 600000, // обновление, мс (10 мин)
    forceMode: 'rain', // опционально: игнорировать API и всегда этот режим
  },
});
```

Метод **`setCountRaindrop(n)`** — изменить число капель на лету (перерисовка, если дождь уже показан).

```javascript
const s = new Snow({ countRaindrop: 40, precipitationMode: 'rain' });
s.setCountRaindrop(150);
```

Пример: [examples/snowflakes-weather.html](examples/snowflakes-weather.html).
