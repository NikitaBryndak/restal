import Script from 'next/script';

const hotToursStyles = `
/*==== Стилизация для модуля горящих туров с типом "плитки" ====*/

/* Отступы для контейнера, содержащего все блоки */
body .hot-block_tiles .hot-wrapper {
    margin-top: 0px;
    margin-left: 0px;
    margin-bottom: 0px;
    margin-right: -10px !important;
}

/* Отступы между блоками */
body .hot-block_tiles .hot-otp-form-wrap {
    margin-top: 10px;
    margin-right: 10px;
}

/* Ширина основного блока */
body .hot-block_tiles .hot-otp-img,
body .hot-block_tiles .hot-otp-tour-block {
    width: 300px !important;
}

/* Градиент основного блока */
body .hot-block_tiles .hot-otp-tour-block {
    background: -moz-linear-gradient(-10deg, rgba(32,32,32,0.75) 0%, rgba(32,32,32,0) 50%), -moz-linear-gradient(10deg, rgba(32,32,32,0.75) 0%, rgba(32,32,32,0) 50%);
    background: -webkit-linear-gradient(-10deg, rgba(32,32,32,0.75) 0%,rgba(32,32,32,0) 50%), -webkit-linear-gradient(10deg, rgba(32,32,32,0.75) 0%,rgba(32,32,32,0) 50%);
    background: linear-gradient(170deg, rgba(32,32,32,0.75) 0%,rgba(32,32,32,0) 50%), linear-gradient(10deg, rgba(32,32,32,0.75) 0%,rgba(32,32,32,0) 50%);
}

/* Скругление углов основного блока */
body .hot-block_tiles .hot-otp-form-wrap {
    border-radius: 4px;
}

/* Плашка под нижний текст */
body .hot-block_tiles .hot-otp-img:after {
    background: rgba(255,0,0,.7);
    height: 0;
}

/* Значение прозрачности фоновой картинки основного блока при наведении */
body .hot-block_tiles .hot-otp-form-wrap:hover .hot-otp-img {
    opacity: .8;
}

/*=== Стилизация частей основного блока ===*/

/*== 1. Заголовок блока ==*/
body .hot-block_tiles .hot-otp-description {
    font-family: arial;
    font-size: 18px;
    line-height: 21px;
    font-weight: bold;
    font-style: normal;
    color: #fff !important;
    padding-top: 18px;
    padding-left: 20px;
    padding-right: 20px;
}
body .hot-block_tiles .hot-otp-tour-block:hover .hot-otp-description {
    text-decoration: none !important;
    color: #fff !important;
}

/*== 2. Строка под заголовком ==*/
body .hot-block_tiles .hot-otp-place {
    font-family: arial;
    font-size: 13px;
    line-height: 15px;
    font-weight: bold;
    font-style: normal !important;
    color: #fff !important;
    padding-top: 0;
    padding-left: 20px;
    padding-right: 20px;
}
body .hot-block_tiles .hot-otp-tour-block:hover .hot-otp-place {
    text-decoration: none !important;
    color: #fff !important;
}

/*== 3. Строка с описанием тура ==*/
body .hot-block_tiles .hot-otp-tour-info {
    font-family: arial;
    font-size: 13px;
    line-height: 16px;
    font-weight: normal;
    font-style: italic;
    color: #fff;
    left: 20px;
    bottom: 13px;
    width: 130px;
}
body .hot-block_tiles .hot-otp-tour-block:hover .hot-otp-tour-info {
    text-decoration: none !important;
    color: #fff !important;
}

/*== 4. Блок с ценой тура ==*/
body .hot-block_tiles .hot-price-block {
    padding-right: 20px;
    padding-bottom: 11px;
}

body .hot-block_tiles .hot-otp-price-count,
body .hot-block_tiles .hot-otp-price-count nobr {
    font-family: arial;
    font-size: 11px;
    line-height: 10px;
    font-weight: normal;
    font-style: normal;
    color: #fff !important;
}
body .hot-block_tiles .hot-otp-price-count {
    width: 60px;
}
body .hot-block_tiles .hot-otp-tour-block:hover .hot-otp-price-count,
body .hot-block_tiles .hot-otp-tour-block:hover .hot-otp-price-count nobr {
    text-decoration: none !important;
    color: #fff !important;
}

body .hot-block_tiles .hot-otp-price a {
    font-family: arial;
    font-size: 24px;
    line-height: 28px;
    font-weight: bold;
    font-style: normal;
    color: #fff !important;
}
body .hot-block_tiles .hot-otp-tour-block:hover .hot-otp-price a {
    text-decoration: none !important;
    color: #fff !important;
}
`;

export default function TourScreenerPage() {
    return (
        <main className="flex-1 container mx-auto px-4 py-8">
            <style dangerouslySetInnerHTML={{ __html: hotToursStyles }} />
            <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700&subset=cyrillic" rel="stylesheet" />
            <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/form.css" type="text/css" />
            <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/result.css" type="text/css" />
            <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/tour.css" type="text/css" />

            <h1 className="text-4xl font-bold mb-6 text-white">Підбір туру</h1>

            {/* Контейнер для горящих туров */}
            <div className="hot-size-checker" id="otpusk_onsite_hot27865">
                <img src="https://export.otpusk.com/os/ajax-loader.gif" alt="Loading..." />
                <span></span>
            </div>

            {/* Конфигурация поиска туров */}
            <Script id="otpusk-config" strategy="beforeInteractive">
                {`
                    var osGeo = '';
                    var osDefaultDeparture = '';
                    var osDefaultDuration = '';
                    var osDateFrom = '';
                    var osDateTo = '';
                    var osHotelCategory = '';
                    var osFood = '';
                    var osTransport = '';
                    var osTarget = '';
                    var osContainer = null;
                    var osTourContainer = null;
                    var osLang = 'ua';
                    var osTourTargetBlank = false;
                    var osOrderUrl = null;
                    var osCurrency = 'converted';
                    var osAutoStart = false;
                `}
            </Script>

            {/* Конфигурация горящих туров */}
            <Script id="hot-tours-config" strategy="beforeInteractive">
                {`
                    var osTarget27865 = "";
                    var osLang = "ua";
                    var osCurrency = "converted";
                    var osTargetBlank27865 = false;
                `}
            </Script>

            {/* Скрипты для поиска туров */}
            <Script
                src="https://api.otpusk.com/api/2.4/session?access_token=3f80a-01423-b3ca6-0bbab-1a284"
                strategy="afterInteractive"
            />
            <Script
                src="https://export.otpusk.com/js/onsite/"
                strategy="afterInteractive"
            />
            <Script
                src="https://export.otpusk.com/js/order"
                strategy="afterInteractive"
            />

            {/* Скрипты для горящих туров */}
            <Script id="hot-tours-loader" strategy="afterInteractive">
                {`
                    (function (d, s) {
                        function loadScript(src, id, callback) {
                            if (d.getElementById(id)) {
                                if (typeof callback === "function") callback();
                                return;
                            }
                            var js = d.createElement(s);
                            js.id = id;
                            js.src = src;
                            js.defer = true;
                            js.onload = function () {
                                if (typeof callback === "function") callback();
                            };
                            d.head.appendChild(js);
                        }
                        if (!window._otpuskApiLoaded) {
                            window._otpuskApiLoaded = true;
                            loadScript("https://export.otpusk.com/api/session?access_token=3f80a-01423-b3ca6-0bbab-1a284", "OShotApi27865", function () {
                                loadScript("https://export.otpusk.com/js/view?id=27865", "OShotGetData27865");
                            });
                        } else {
                            loadScript("https://export.otpusk.com/js/view?id=27865", "OShotGetData27865");
                        }
                    }(document, "script"));
                `}
            </Script>
        </main>
    );
}