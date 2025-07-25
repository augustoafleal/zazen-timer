use dioxus::prelude::*;
use gloo_timers::future::TimeoutFuture;
use std::time::Duration;
use web_sys::HtmlAudioElement;

const FAVICON: Asset = asset!("/assets/favicon/favicon.ico");
const ANDROID_CHROME_192: Asset = asset!("/assets/favicon/android-chrome-192x192.png");
const ANDROID_CHROME_512: Asset = asset!("/assets/favicon/android-chrome-512x512.png");
const APPLE_TOUCH_ICON: Asset = asset!("/assets/favicon/apple-touch-icon.png");
const FAVICON_16: Asset = asset!("/assets/favicon/favicon-16x16.png");
const FAVICON_32: Asset = asset!("/assets/favicon/favicon-32x32.png");
const ENSO_CIRCLE: Asset = asset!("/assets/enso_circle.png");
const TAILWIND_CSS: Asset = asset!("/assets/tailwind.css");
const ZEN_BELL: Asset = asset!("/assets/zen_bell.mp3");

#[derive(Clone, Copy, Debug)]
struct Timer {
    remaining: Duration,
    overtime: Duration,
    preparation: Duration,
    active: bool,
    run_id: u32,
}

impl Timer {
    fn new(total_seconds: u64) -> Self {
        Self {
            remaining: Duration::from_secs(total_seconds),
            overtime: Duration::ZERO,
            preparation: Duration::from_secs(30),
            active: false,
            run_id: 1,
        }
    }

    fn minutes(&self) -> u64 {
        self.remaining.as_secs() / 60
    }

    fn seconds(&self) -> u64 {
        self.remaining.as_secs() % 60
    }

    fn overtime_minutes(&self) -> u64 {
        self.overtime.as_secs() / 60
    }

    fn overtime_seconds(&self) -> u64 {
        self.overtime.as_secs() % 60
    }

    fn preparation_seconds(&self) -> u64 {
        self.preparation.as_secs() % 60
    }
}

fn main() {
    dioxus::launch(App);
}

#[component]
fn App() -> Element {
    let mut timer = use_signal(|| Timer::new(20 * 60));
    let zen_bell_path = ZEN_BELL.to_string();
    let audio = use_signal(|| HtmlAudioElement::new_with_src(&zen_bell_path).expect("failed to create audio element"));

    rsx!(

        StylesAndLinks {}
        div { class: "flex flex-col items-center justify-center min-h-screen bg-black p-6",
            TimerDisplay { timer }

            div { class: "flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-md p-6 rounded-xl bg-black",
                div { class: "flex flex-col gap-4 flex-1",

                    button {
                        class: "px-6 py-3 bg-transparent text-white rounded-lg border border-white/20 hover:bg-white/10
                                        transition-all duration-200 font-medium flex items-center justify-center",
                        onclick: move |_| {
                            if (!timer().active) && (timer().minutes() > 5) {
                                timer.write().remaining = (timer().remaining - Duration::from_secs(5 * 60))
                                    .max(Duration::from_secs(5 * 60));
                            }
                        },
                        "-5 min"
                    }

                    button {
                        class: "px-6 py-3 bg-transparent text-white rounded-lg border border-white/20 hover:bg-white/10
                                        transition-all duration-200 font-medium flex items-center justify-center",
                        onclick: move |_| {
                            if !timer().active {
                                timer.write().remaining = (timer().remaining + Duration::from_secs(5 * 60))
                                    .min(Duration::from_secs(40 * 60));
                            }
                        },
                        "+5 min"
                    }
                }
                div { class: "flex flex-col gap-4 flex-1",

                    button {
                        class: "px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200
                                        transition-all duration-200 font-medium flex items-center justify-center",
                        onclick: move |_| {

                            timer.write().active = !timer().active;
                            if timer().active {
                                let current_run = timer().run_id;

                                spawn(async move {

                                    while timer().active && timer().preparation > Duration::ZERO {
                                        TimeoutFuture::new(1_000).await;
                                        if timer().run_id != current_run {
                                            return;
                                        }
                                        timer.write().preparation = timer()
                                            .preparation
                                            .saturating_sub(Duration::from_secs(1));
                                        if timer().preparation_seconds() == 1 {
                                                let _ = audio().play();                                        }

                                    }

                                    while timer().active {
                                        TimeoutFuture::new(1_000).await;
                                        if timer().run_id != current_run {
                                            break;
                                        }
                                        let mut timer = timer.write();
                                        if timer.remaining > Duration::ZERO {
                                            timer.remaining -= Duration::from_secs(1);
                                            if timer.minutes() == 0 && timer.seconds() == 1 {
                                                let _ = audio().play();
                                            }
                                        } else {
                                            timer.overtime += Duration::from_secs(1);
                                        }
                                    }
                                });
                            }
                        },
                        if timer().active {
                            "Pause"
                        } else {
                            "Start"
                        }
                    }

                    button {
                        class: "px-6 py-3 bg-transparent text-white rounded-lg border border-white/20 hover:bg-white/10
                                        transition-all duration-200 font-medium flex items-center justify-center",
                        onclick: move |_| {
                            let mut t = timer();
                            let new_run_id = t.run_id + 1;
                            timer
                                .set(Timer {
                                    remaining: Duration::from_secs(20 * 60),
                                    overtime: Duration::ZERO,
                                    preparation: Duration::from_secs(30),
                                    active: false,
                                    run_id: new_run_id,
                                });
                        },
                        "Reset"
                    }
                }
            }
        }


    )
}

#[component]
fn TimerDisplay(timer: Signal<Timer>) -> Element {
    let minutes = timer().minutes();
    let seconds = timer().seconds();
    let overtime_min = timer().overtime_minutes();
    let overtime_sec = timer().overtime_seconds();
    let preparation_sec = timer().preparation_seconds();

    rsx! {

        div { class: "text-center mb-8",
            div { class: "inline-block relative w-64 h-64 mx-auto",

            div {
                    class: "absolute inset-0",
                    style: "background: url('{ENSO_CIRCLE}') center/contain no-repeat; opacity: 0.4;",
                }

                div { class: "relative h-full flex flex-col justify-center items-center",
                    h1 {
                        class: format!(
                            "font-mono font-bold text-8xl tracking-tighter {} mt-4",
                            if (minutes == 0) && (seconds == 0) {
                                "bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 animate-pulse"
                            } else {
                                "text-white"
                            },
                        ),
                        "{minutes}:{seconds:02}"
                    }
                }
            }

            div { class: "min-h-[4rem]",
                if preparation_sec > 0 {
                    h2 { class: "font-mono text-3xl text-blue-400 animate-pulse",
                        "Preparation: {preparation_sec}s"
                    }
                } else if timer().overtime > Duration::ZERO {
                    h2 { class: "font-mono text-3xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-pulse",
                        "+{overtime_min}:{overtime_sec:02}"
                    }
                }
            }

        }

    }
}

#[component]
pub fn StylesAndLinks() -> Element {
    rsx! {
        document::Link { rel: "icon", href: FAVICON }
        document::Link { rel: "icon", href: ANDROID_CHROME_192 },
        document::Link { rel: "icon", href: ANDROID_CHROME_512 },
        document::Link { rel: "apple-touch-icon", href: APPLE_TOUCH_ICON },
        document::Link { rel: "icon", href: FAVICON_16 },
        document::Link { rel: "icon", href: FAVICON_32 },
        document::Stylesheet {href: TAILWIND_CSS}
    }
}