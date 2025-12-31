declare module "chalk-animation" {
  interface Animation {
    start(): Animation;
    stop(): Animation;
  }

  interface ChalkAnimation {
    rainbow(text: string): Animation;
    pulse(text: string): Animation;
    glitch(text: string): Animation;
    radar(text: string): Animation;
    neon(text: string): Animation;
    karaoke(text: string): Animation;
  }

  const chalkAnimation: ChalkAnimation;
  export default chalkAnimation;
}
