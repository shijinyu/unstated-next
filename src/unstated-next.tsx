import React from "react"

const EMPTY: unique symbol = Symbol()

export type ContainerProviderProps<
	State extends any[]
> = React.PropsWithChildren<{
	initialState: State
}>

export type ContainerConsumerProps<Value> = {
	children: (value: Value) => React.ReactNode
}

export type UseHookFn<Value, State extends any[]> = (...args: State) => Value

interface withContainerBaseProps<Value> {
	$inject: Value
}

function providerRequired<Value>(value: Value | typeof EMPTY): Value {
	if (value === EMPTY) {
		throw new Error("Component must be wrapped with <Container.Provider>")
	}
	return value
}

export function createContainer<Value, State extends any[]>(
	useHook: UseHookFn<Value, State>,
) {
	const Context = React.createContext<Value | typeof EMPTY>(EMPTY)

	function Provider({ initialState, children }: ContainerProviderProps<State>) {
		const value = useHook(...initialState)
		return <Context.Provider value={value}>{children}</Context.Provider>
	}

	function useContainer(): Value {
		const value = React.useContext(Context)
		return providerRequired(value)
	}

	function withContainer<P extends withContainerBaseProps<Value>>(
		Component: React.ComponentType<P>,
	) {
		const componentName = Component.name || "Anonymous"
		const Consumer = ({ children }: ContainerConsumerProps<Value>) => {
			return (
				<Context.Consumer>
					{value => {
						return children(providerRequired(value))
					}}
				</Context.Consumer>
			)
		}
		const result = {
			[componentName]: {
				Consumer,
				WrappedComponent: (props: P) => {
					return (
						<Context.Consumer>
							{value => {
								return (
									<Component {...props} $inject={providerRequired(value)} />
								)
							}}
						</Context.Consumer>
					)
				},
			},
		}
		return result[componentName]
	}

	return { Provider, useContainer, withContainer }
}
