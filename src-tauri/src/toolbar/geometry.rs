/// Screen rectangle in physical pixels.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Bounds {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

/// Place the toolbar beside `mirror`: to its right when it fits in `work`,
/// otherwise to its left, always clamped inside `work`.
pub fn dock_position(mirror: Bounds, toolbar: (i32, i32), gap: i32, work: Bounds) -> (i32, i32) {
    let (width, height) = toolbar;

    let right_side = mirror.right + gap;
    let x = if right_side + width <= work.right {
        right_side
    } else {
        mirror.left - gap - width
    };

    let x = x.clamp(work.left, (work.right - width).max(work.left));
    let y = mirror.top.clamp(work.top, (work.bottom - height).max(work.top));
    (x, y)
}

#[cfg(test)]
mod tests {
    use super::*;

    const WORK: Bounds = Bounds {
        left: 0,
        top: 0,
        right: 1920,
        bottom: 1040,
    };

    #[test]
    fn docks_right_when_space() {
        let mirror = Bounds { left: 700, top: 100, right: 1100, bottom: 900 };
        assert_eq!(dock_position(mirror, (56, 520), 8, WORK), (1108, 100));
    }

    #[test]
    fn docks_left_at_screen_edge() {
        let mirror = Bounds { left: 1500, top: 100, right: 1900, bottom: 900 };
        assert_eq!(dock_position(mirror, (56, 520), 8, WORK), (1436, 100));
    }

    #[test]
    fn stays_inside_work_area() {
        let mirror = Bounds { left: 0, top: 800, right: 1920, bottom: 1040 };
        assert_eq!(dock_position(mirror, (56, 520), 8, WORK), (0, 520));
    }
}
