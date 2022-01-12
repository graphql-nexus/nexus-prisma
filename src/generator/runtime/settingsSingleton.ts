import * as Setset from 'setset'
import * as Settings from './settings'

export const settings = Settings.create()

export const changeSettings = (input: Setset.UserInput<Settings.Input>): void => {
  settings.change(input)
}
