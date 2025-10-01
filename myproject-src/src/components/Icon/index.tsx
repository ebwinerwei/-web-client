const Index = (props: { name: string, color?: string, fontSize?: string | number, margin?: string | number }) => {
    const style = {} as any
    if (props.color) {
        style.color = props.color
    }
    if (props.fontSize) {
        style.fontSize = props.fontSize
    }
    if (props.margin) {
        style.margin = props.margin
    }
    return <svg className={`icon`} style={style} aria-hidden="true">
        <use xlinkHref={`#${props.name}`}></use>
    </svg>
}

export default Index