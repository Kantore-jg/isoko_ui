import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import { APP_NAME } from './app/index.js';
import { marketStore } from './store/index.js';
import './styles/main.css';

document.title = APP_NAME;

async function bootstrap() {
  await marketStore.init();
  createApp(App).use(router).mount('#app');
}

bootstrap();
