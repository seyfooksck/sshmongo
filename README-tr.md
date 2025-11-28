
 # sshmongo

 **Açıklama:** Bu paket, uzak bir sunucuya SSH tüneli açıp tünel üzerinden `mongoose` ile MongoDB'ye bağlanmanızı sağlar. `tunnel-ssh` kullanarak uzak makinedeki MongoDB portunu yerel bir porta yönlendirir ve `mongoose` ile o porta bağlanır.

 **Hedef:** Uzak sunucudaki MongoDB'yi doğrudan açmadan, SSH ile güvenli bir tünel üzerinden kullanmak isteyen projeler için hızlı bir yardımcıdır.

**İçindekiler**
- Kurulum
- Hızlı Başlangıç (örnek)
- API Referansı
- Kullanım Örnekleri (Inline test / Ortam değişkeni)
- Kapanış ve Temizlik
- Güvenlik ve İpuçları
- Hata Giderme (Troubleshooting)

## Kurulum

Projeyi indirdikten sonra proje dizininde bağımlılıkları yükleyin:

```bash
cd /d f:\Module\sshmongo
npm install
```

> Not: Paket `tunnel-ssh`, `get-port` ve `mongoose` bağımlılıklarını kullanır.

## Hızlı Başlangıç

1. `examples/example.js` dosyasını test amaçlı düzenleyin (veya kendi kodunuzda `connect` fonksiyonunu kullanın).
2. SSH erişiminizin ve uzak MongoDB'nin (genellikle `127.0.0.1:27017`) erişilebilir olduğundan emin olun.
3. Örneği çalıştırın:

```bash
node examples/example.js
```

Program başarılıysa konsolda tünel portu, mongoose URI ve örnek kayıt çıktıları görünecektir.

## API Referansı

- `const { connect } = require('./index.js')`
- `await connect(options)` — SSH tüneli oluşturur, `mongoose` ile bağlanır ve bir obje döndürür.

connect(options) parametreleri (kısa):

- `options.ssh`: SSH bağlantı bilgileri. Örnek:

  ```js
  {
    host: 'ssh.example.com',
    port: 22,
    username: 'root',
    // authentication: either password or privateKey / privateKeyPath
    password: 'mypassword',
    // or
    privateKeyPath: '/home/user/.ssh/id_rsa'
  }
  ```

- `options.mongo`: Mongo hedef bilgileri (uzak taraf). Örnek:

  ```js
  { host: '127.0.0.1', port: 27017, dbName: 'mydb', localPort: 27000 /* optional */ }
  ```

- `options.mongooseOptions`: (opsiyonel) `mongoose.connect`'e geçilecek ek seçenekler.

connect döndürdüğü obje:

- `{ mongoose, connection, uri, localPort, server, sshConnection, close }`

- `close()` çağrıldığında `mongoose` bağlantısı sonlandırılır ve SSH tüneli kapatılır.

## Kullanım Örnekleri

1) Inline test (hızlı lokal test için — **commit etmeyin**):

```js
const { connect } = require('sshmongo'); // veya proje içinden: require('..')

(async () => {
  const ssh = {
    host: 'vds.example.dev',
    port: 22,
    username: 'root',
    password: 'TEST_PASSWORD' // sadece test için: saklamayın
  };

  const mongo = { host: '127.0.0.1', port: 27017, dbName: 'test' };

  const { mongoose, localPort, uri, close } = await connect({ ssh, mongo });
  console.log('Connected to', uri);

  // normal mongoose kullanımı
  const Cat = mongoose.model('Cat', { name: String });
  await Cat.create({ name: 'Whiskers' });
  console.log(await Cat.find().lean());

  await close();
})();
```

2) Ortam değişkenleri ile (daha güvenli): `examples/example.js` içinde örnek gösterimi mevcuttur. `process.env` yerine tercih ediyorsanız kendi konfigürasyon loader'ınızı kullanabilirsiniz.

## Kapanış / Temizlik

Bağlantıyı kapatmak için dönen objenin `close()` metodunu çağırın. Bu metod hem `mongoose.disconnect()` hem de SSH bağlantısını sonlandırır. Örnek:

```js
await close();
```

Uygulama process'ine sinyal yakalama ekleyerek (ör. `SIGINT`) güvenli kapanış sağlanabilir:

```js
process.on('SIGINT', async () => {
  await close();
  process.exit(0);
});
```

## Güvenlik ve İpuçları

- Hassas bilgileri (SSH parolaları, özel anahtarlar) kaynak koda yazmayın.
- Test amaçlı inline şifre sadece lokal, geçici testler içindir. Gerçek projelerde `process.env`, `.env` + `dotenv` veya bir secret manager kullanın.
- SSH özel anahtarlarını dosya sistemi izinleriyle koruyun (ör. `600`).

## Hata Giderme

- `privateKeyPath not found`: `ssh.privateKeyPath` ile belirttiğiniz dosya bulunamadı.
- `ECONNREFUSED` veya bağlantı hataları: Uzak sunucuda SSH erişiminizin ve hedef MongoDB'nin çalıştığından emin olun. Uzak sunucu üzerinde MongoDB genellikle `127.0.0.1:27017` üzerinde olabilir; `tunnel-ssh` bu adrese bağlantı açar.
- `tunnel is not a function` veya API hataları: `tunnel-ssh` sürümünü `package.json` içinde kontrol edin; paket 5.x sürümüyle `createTunnel` API'si kullanılır.

## Geliştirme ve Test

- `examples/example.js` projenin kökünde test amaçlı bulunmaktadır. Değiştirip `node examples/example.js` ile deneyin.
- İsterseniz basit unit test'ler ve GitHub Actions CI ekleyebilirim.

## Katkıda Bulunma

1. Fork
2. Branch oluştur
3. PR gönder

## Lisans

MIT
