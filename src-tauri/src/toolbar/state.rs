use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Mutex;

use tauri::{PhysicalPosition, PhysicalSize};

#[derive(Clone, Copy)]
pub struct SavedFrame {
    pub position: PhysicalPosition<i32>,
    pub size: PhysicalSize<u32>,
    pub maximized: bool,
}

/// Each toolbar session gets a new `generation`; the dock thread stops applying
/// window changes as soon as its generation is no longer current.
#[derive(Default)]
pub struct ToolbarState {
    active: AtomicBool,
    generation: AtomicU64,
    apply: Mutex<()>,
    saved: Mutex<Option<SavedFrame>>,
}

impl ToolbarState {
    pub fn is_active(&self) -> bool {
        self.active.load(Ordering::SeqCst)
    }

    pub fn generation(&self) -> u64 {
        self.generation.load(Ordering::SeqCst)
    }

    pub fn activate(&self, saved: SavedFrame) -> u64 {
        let _guard = self.apply.lock().unwrap_or_else(|e| e.into_inner());
        *self.saved.lock().unwrap_or_else(|e| e.into_inner()) = Some(saved);
        self.active.store(true, Ordering::SeqCst);
        self.generation.fetch_add(1, Ordering::SeqCst) + 1
    }

    /// Returns the frame to restore, or `None` if toolbar mode wasn't active.
    pub fn deactivate(&self) -> Option<Option<SavedFrame>> {
        let _guard = self.apply.lock().unwrap_or_else(|e| e.into_inner());
        if !self.active.swap(false, Ordering::SeqCst) {
            return None;
        }
        self.generation.fetch_add(1, Ordering::SeqCst);
        Some(self.saved.lock().unwrap_or_else(|e| e.into_inner()).take())
    }

    /// Run `apply` only if `generation` is still the current toolbar session.
    pub fn apply_if_current(&self, generation: u64, apply: impl FnOnce()) {
        let _guard = self.apply.lock().unwrap_or_else(|e| e.into_inner());
        if self.is_active() && self.generation() == generation {
            apply();
        }
    }
}
