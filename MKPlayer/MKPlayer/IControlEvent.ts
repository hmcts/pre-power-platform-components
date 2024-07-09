export interface IControlEvent {
    EventName: 'OnReady' | 'OnPlay' | 'OnPause';
    EventValue?: string;
}
