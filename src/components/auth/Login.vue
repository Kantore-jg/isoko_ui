<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 text-slate-700">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(27,44,193,0.18),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(171,210,250,0.22),_transparent_32%)]" />

    <div class="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
      <div class="mb-6 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-[#1B2CC1] text-2xl font-bold text-white">M</div>
        <h1 class="text-xl font-bold text-slate-900">Connexion</h1>
      </div>

      <form class="space-y-4" @submit.prevent="submitLogin">
        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-slate-700">Identifiant</span>
          <input v-model="form.login" type="text" class="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none" autocomplete="username" required>
        </label>

        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-slate-700">Mot de passe</span>
          <input v-model="form.password" type="password" class="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none" autocomplete="current-password" required>
        </label>

        <p v-if="errorMessage" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {{ errorMessage }}
        </p>

        <button type="submit" :disabled="isLoggingIn" class="w-full rounded-xl bg-[#1B2CC1] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#152399] disabled:cursor-not-allowed disabled:opacity-60">
          {{ isLoggingIn ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { marketStore } from '../../store/index.js';

const emit = defineEmits(['success']);
const router = useRouter();

const form = reactive({
  login: '',
  password: '',
});

const isLoggingIn = ref(false);
const errorMessage = ref('');

async function submitLogin() {
  isLoggingIn.value = true;
  errorMessage.value = '';

  try {
    await marketStore.login({
      login: form.login,
      password: form.password,
    });
    emit('success');
    await router.replace('/dashboard');
  } catch (error) {
    errorMessage.value = error?.message || 'Connexion impossible.';
  } finally {
    isLoggingIn.value = false;
  }
}
</script>
