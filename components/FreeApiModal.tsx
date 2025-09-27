import React from 'react';
import { CloseIcon, ApiKeyIcon } from './icons';

interface FreeApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GENERAL_APIS = [
    {
        name: 'JSONPlaceholder',
        description: 'واجهة برمجة تطبيقات REST وهمية مثالية للنماذج الأولية والاختبار. توفر بيانات وهمية للمستخدمين، والمنشورات، والتعليقات، وما إلى ذلك.',
        link: 'https://jsonplaceholder.typicode.com/'
    },
    {
        name: 'OpenWeatherMap',
        description: 'توفر بيانات الطقس الحالية والمتوقعة. تتطلب مفتاح API مجاني للوصول إلى معظم نقاط النهاية.',
        link: 'https://openweathermap.org/api'
    },
    {
        name: 'The Movie DB (TMDb)',
        description: 'واجهة برمجة تطبيقات شاملة لبيانات الأفلام والبرامج التلفزيونية والممثلين. تتطلب مفتاح API مجاني.',
        link: 'https://www.themoviedb.org/documentation/api'
    },
    {
        name: 'PokéAPI',
        description: 'واجهة برمجة تطبيقات RESTful مجانية ومفتوحة المصدر لجميع بيانات Pokémon من الألعاب.',
        link: 'https://pokeapi.co/'
    },
    {
        name: 'GIPHY API',
        description: 'تسمح لك بدمج مكتبة GIPHY الواسعة من صور GIF والملصقات المتحركة في تطبيقك. تتطلب مفتاح API مجاني.',
        link: 'https://developers.giphy.com/docs/api/'
    },
    {
        name: 'NewsAPI',
        description: 'واجهة برمجة تطبيقات للحصول على المقالات الإخبارية من مصادر مختلفة حول العالم. تتطلب مفتاح API مجاني.',
        link: 'https://newsapi.org/'
    },
    {
        name: 'Unsplash API',
        description: 'توفر وصولاً إلى مكتبة ضخمة من الصور عالية الجودة والمجانية. تتطلب مفتاح API مجاني.',
        link: 'https://unsplash.com/developers'
    },
    {
        name: 'JokeAPI',
        description: 'واجهة برمجة تطبيقات بسيطة للحصول على نكت برمجية ومتنوعة. لا تتطلب مفتاح API.',
        link: 'https://sv443.net/jokeapi/v2/'
    },
    {
        name: 'ExchangeRate-API',
        description: 'توفر بيانات أسعار صرف العملات الموثوقة والمحدثة. تتطلب مفتاح API مجاني.',
        link: 'https://www.exchangerate-api.com/'
    },
    {
        name: 'Quotable',
        description: 'توفر اقتباسات ملهمة من مؤلفين مشهورين. لا تتطلب مفتاح API.',
        link: 'https://github.com/lukePeavey/quotable'
    }
];

const ANIME_APIS = [
    { name: 'AniAPI', description: 'واجهة برمجة تطبيقات أنمي متقدمة، مع التورنت والعلاقات وجداول البث والمزيد.', link: 'https://aniapi.com/docs' },
    { name: 'AniDB', description: 'قاعدة بيانات أنمي عريقة مع واجهة برمجة تطبيقات HTTP شاملة.', link: 'https://wiki.anidb.net/HTTP_API_Definition' },
    { name: 'AnimeChan', description: 'واجهة برمجة تطبيقات REST بسيطة للحصول على اقتباسات أنمي عشوائية.', link: 'https://animechan.vercel.app/' },
    { name: 'Anime Facts', description: 'واجهة برمجة تطبيقات REST بسيطة تقدم حقائق أنمي عشوائية.', link: 'https://chandan-02.github.io/anime-facts-rest-api/' },
    { name: 'Anime News Network', description: 'توفر وصولاً عبر واجهة برمجة التطبيقات إلى موسوعتها الخاصة بالأنمي والمانجا.', link: 'https://www.animenewsnetwork.com/encyclopedia/api.php' },
    { name: 'Catboy', description: 'واجهة برمجة تطبيقات لصور وردود catboy والمزيد.', link: 'https://catboys.com/api' },
    { name: 'Danbooru Anime', description: 'واجهة برمجة تطبيقات لموقع Danbooru للصور، متخصص في فنون الأنمي.', link: 'https://danbooru.donmai.us/wiki_pages/help:api' },
    { name: 'Jikan (MyAnimeList Unofficial)', description: 'واجهة برمجة تطبيقات غير رسمية لموقع MyAnimeList، توفر بيانات شاملة عن الأنمي والمانجا.', link: 'https://docs.api.jikan.moe/' },
    { name: 'Kitsu', description: 'منصة حديثة لاكتشاف الأنمي مع واجهة برمجة تطبيقات شاملة لبيانات الأنمي والمانجا والمستخدمين.', link: 'https://kitsu.docs.apiary.io/' },
    { name: 'MangaDex', description: 'واجهة برمجة تطبيقات واسعة للمانجا والفصول والأغلفة والمزيد.', link: 'https://api.mangadex.org/docs/' },
    { name: 'Mangapi', description: 'واجهة برمجة تطبيقات للحصول على معلومات المانجا والفصول والصفحات.', link: 'https://rapidapi.com/mangapi-mangapi-default/api/mangapi/' },
    { name: 'MyAnimeList (official)', description: 'واجهة برمجة التطبيقات الرسمية لموقع MyAnimeList، تتيح الوصول إلى قوائم المستخدمين وبيانات الأنمي/المانجا.', link: 'https://myanimelist.net/apiconfig/references/api/v2' },
    { name: 'Nekos.Best', description: 'واجهة برمجة تطبيقات لصور الأنمي تقدم صورًا وملفات GIF عالية الجودة.', link: 'https://nekos.best/' },
    { name: 'Shikimori', description: 'واجهة برمجة تطبيقات لموقع تتبع الأنمي/المانجا الروسي Shikimori.', link: 'https://shikimori.one/api/doc' },
    { name: 'Studio Ghibli', description: 'توفر بيانات حول أفلام وشخصيات وأنواع ومواقع استوديو غيبلي.', link: 'https://ghibliapi.vercel.app/' },
    { name: 'Trace.moe', description: 'واجهة برمجة تطبيقات لتتبع مصدر لقطة شاشة من أنمي.', link: 'https://soruly.github.io/trace.moe-api/' },
    { name: 'Waifu.im', description: 'واجهة برمجة تطبيقات قوية وبسيطة لصور الأنمي.', link: 'https://waifu.im/docs' },
    { name: 'Waifu.pics', description: 'واجهة برمجة تطبيقات لصور وملفات GIF أنمي عالية الجودة (SFW و NSFW).', link: 'https://waifu.pics/docs' },
];

const DESIGN_ART_APIS = [
    { name: 'Améthyste', description: 'واجهة برمجة تطبيقات لتوليد ومعالجة الصور.', link: 'https://amethyste.moe/' },
    { name: 'Art Institute of Chicago', description: 'توفر وصولاً لبيانات مجموعة معهد شيكاغو للفنون.', link: 'https://api.artic.edu/docs/' },
    { name: 'Colormind', description: 'واجهة برمجة تطبيقات لتوليد لوحات الألوان.', link: 'http://colormind.io/api-access/' },
    { name: 'ColourLovers', description: 'واجهة برمجة تطبيقات لمشاركة الألوان واللوحات والأنماط.', link: 'https://www.colourlovers.com/api' },
    { name: 'Cooper Hewitt', description: 'واجهة برمجة تطبيقات متحف كوبر هيويت للتصميم.', link: 'https://collection.cooperhewitt.org/api/' },
    { name: 'Dribbble', description: 'تتيح الوصول إلى بيانات من Dribbble، مجتمع للمصممين.', link: 'https://developer.dribbble.com/' },
    { name: 'EmojiHub', description: 'واجهة برمجة تطبيقات بسيطة للحصول على رموز تعبيرية (emojis).', link: 'https://emojihub.herokuapp.com/' },
    { name: 'Europeana', description: 'توفر وصولاً إلى محتوى التراث الثقافي الأوروبي.', link: 'https://pro.europeana.eu/page/using-the-api' },
    { name: 'Harvard Art Museums', description: 'واجهة برمجة تطبيقات لبيانات مجموعة متاحف هارفارد للفنون.', link: 'https://www.harvardartmuseums.org/collections/api' },
    { name: 'Icon Horse', description: 'واجهة برمجة تطبيقات للحصول على أيقونات المواقع (favicons).', link: 'https://icon.horse/' },
    { name: 'Iconfinder', description: 'توفر وصولاً للبحث في ملايين الأيقونات.', link: 'https://developer.iconfinder.com/' },
    { name: 'Icons8', description: 'واجهة برمجة تطبيقات للوصول إلى مكتبة أيقونات Icons8.', link: 'https://icons8.com/icons' },
    { name: 'Lordicon', description: 'توفر وصولاً إلى مكتبة من الأيقونات المتحركة.', link: 'https://lordicon.com/' },
    { name: 'Metropolitan Museum of Art', description: 'توفر وصولاً لبيانات جميع الأعمال الفنية في متحف المتروبوليتان.', link: 'https://metmuseum.github.io/' },
    { name: 'Noun Project', description: 'واجهة برمجة تطبيقات لأكثر من 5 ملايين أيقونة.', link: 'https://api.thenounproject.com/' },
    { name: 'PHP-Noise', description: 'واجهة برمجة تطبيقات لتوليد صور ضوضاء إجرائية.', link: 'https://www.php-noise.com/' },
    { name: 'Pixel Encounter', description: 'واجهة برمجة تطبيقات لتوليد شخصيات بكسل عشوائية.', link: 'https://pixelencounter.com/' },
    { name: 'Rijksmuseum', description: 'واجهة برمجة تطبيقات لمجموعة متحف ريكز.', link: 'https://www.rijksmuseum.nl/en/api' },
    { name: 'Word Cloud', description: 'واجهة برمجة تطبيقات لإنشاء سحابات كلمات من النصوص.', link: 'https://www.wordcloudapi.com/' },
    { name: 'xColors', description: 'واجهة برمجة تطبيقات للحصول على لوحات ألوان.', link: 'https://www.x-colors.com/api' },
];

const STORAGE_FILES_APIS = [
    { name: 'AnonFiles', description: 'واجهة برمجة تطبيقات لمشاركة الملفات بشكل مجهول.', link: 'https://anonfiles.com/docs/api' },
    { name: 'BayFiles', description: 'واجهة برمجة تطبيقات لمشاركة الملفات مع حدود حجم سخية.', link: 'https://bayfiles.com/docs' },
    { name: 'Box', description: 'منصة آمنة لإدارة المحتوى والتعاون ومشاركة الملفات.', link: 'https://developer.box.com/' },
    { name: 'ddownload', description: 'واجهة برمجة تطبيقات لخدمة استضافة الملفات ddownload.', link: 'https://ddownload.com/api' },
    { name: 'Dropbox', description: 'تتيح الوصول إلى ملفات المستخدمين ومزامنتها ومشاركتها.', link: 'https://www.dropbox.com/developers' },
    { name: 'File.io', description: 'مشاركة ملفات بسيطة ومؤقتة تختفي بعد التنزيل.', link: 'https://www.file.io/' },
    { name: 'Filestack', description: 'واجهة برمجة تطبيقات قوية لتحميل الملفات ومعالجتها وتسليمها.', link: 'https://www.filestack.com/docs/api/' },
    { name: 'GoFile', description: 'منصة مشاركة ملفات مجانية وغير محدودة.', link: 'https://gofile.io/api' },
    { name: 'Google Drive', description: 'تتيح الوصول إلى الملفات والمجلدات في Google Drive وإنشاءها وتعديلها.', link: 'https://developers.google.com/drive' },
    { name: 'Gyazo', description: 'واجهة برمجة تطبيقات لأخذ لقطات شاشة وصور GIF وتحميلها على الفور.', link: 'https://gyazo.com/api' },
    { name: 'Imgbb', description: 'خدمة استضافة صور مجانية وسهلة الاستخدام مع واجهة برمجة تطبيقات.', link: 'https://api.imgbb.com/' },
    { name: 'OneDrive', description: 'تتيح الوصول إلى الملفات والمجلدات في Microsoft OneDrive.', link: 'https://developer.microsoft.com/en-us/onedrive' },
    { name: 'Pantry', description: 'تخزين JSON بسيط ومجاني للمشاريع الصغيرة وتطبيقات الويب.', link: 'https://getpantry.cloud/docs' },
    { name: 'Pastebin', description: 'واجهة برمجة تطبيقات لموقع Pastebin لإنشاء ومشاركة مقتطفات نصية.', link: 'https://pastebin.com/api' },
    { name: 'Pinata', description: 'خدمة تثبيت IPFS لتخزين البيانات على الويب اللامركزي.', link: 'https://docs.pinata.cloud/' },
    { name: 'Quip', description: 'تتيح الوصول إلى المستندات والمحادثات في Quip.', link: 'https://quip.com/dev/automation/documentation' },
    { name: 'Storj', description: 'تخزين سحابي لامركزي يوفر خصوصية وأمانًا محسنًا.', link: 'https://docs.storj.io/api/' },
    { name: 'The Null Pointer', description: 'خدمة استضافة ملفات بسيطة ومؤقتة.', link: 'https://thenullpointer.com/' },
    { name: 'Web3 Storage', description: 'تخزين بيانات مجاني وسهل على شبكة IPFS اللامركزية.', link: 'https://web3.storage/docs/' },
];


const FreeApiModal: React.FC<FreeApiModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ApiKeyIcon />
            <h2 className="text-xl font-bold text-sky-300">قائمة واجهات برمجة التطبيقات المجانية (APIs)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </header>
        <div className="p-6 overflow-y-auto">
          <p className="text-slate-400 mb-6">
            استخدم هذه الواجهات البرمجية المجانية لإضافة بيانات حقيقية إلى مشاريعك. اذكر ببساطة في طلبك أنك تريد استخدام إحدى هذه الواجهات، وسيقوم الذكاء الاصطناعي بدمجها لك!
          </p>
          
          <h3 className="text-xl font-bold text-sky-300 mb-4 border-b border-sky-800 pb-2">واجهات برمجة تطبيقات عامة</h3>
          <ul className="space-y-4">
            {GENERAL_APIS.map(api => (
              <li key={api.name} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/80">
                <h3 className="font-bold text-lg text-sky-400">{api.name}</h3>
                <p className="text-slate-300 my-2 text-sm">{api.description}</p>
                <a 
                  href={api.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  الوثائق &rarr;
                </a>
              </li>
            ))}
          </ul>

          <h3 className="text-xl font-bold text-sky-300 mt-8 mb-4 border-b border-sky-800 pb-2">واجهات برمجة تطبيقات التصميم والفن</h3>
          <ul className="space-y-4">
            {DESIGN_ART_APIS.map(api => (
              <li key={api.name} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/80">
                <h3 className="font-bold text-lg text-sky-400">{api.name}</h3>
                <p className="text-slate-300 my-2 text-sm">{api.description}</p>
                <a 
                  href={api.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  الوثائق &rarr;
                </a>
              </li>
            ))}
          </ul>
          
          <h3 className="text-xl font-bold text-sky-300 mt-8 mb-4 border-b border-sky-800 pb-2">واجهات برمجة تطبيقات الأنمي والمانجا</h3>
           <ul className="space-y-4">
            {ANIME_APIS.map(api => (
              <li key={api.name} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/80">
                <h3 className="font-bold text-lg text-sky-400">{api.name}</h3>
                <p className="text-slate-300 my-2 text-sm">{api.description}</p>
                <a 
                  href={api.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  الوثائق &rarr;
                </a>
              </li>
            ))}
          </ul>

          <h3 className="text-xl font-bold text-sky-300 mt-8 mb-4 border-b border-sky-800 pb-2">واجهات برمجة تطبيقات التخزين والملفات</h3>
           <ul className="space-y-4">
            {STORAGE_FILES_APIS.map(api => (
              <li key={api.name} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/80">
                <h3 className="font-bold text-lg text-sky-400">{api.name}</h3>
                <p className="text-slate-300 my-2 text-sm">{api.description}</p>
                <a 
                  href={api.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  الوثائق &rarr;
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FreeApiModal;