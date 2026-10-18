<template>
  <div class="relative h-full">
    <div class="app-scroller">
      <main class="safe-top safe-x mx-auto max-w-2xl pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <slot />
      </main>
    </div>
    <BottomNav />
  </div>
</template>
