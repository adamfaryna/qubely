const { Component } = wp.element;
const { RichText } = wp.blockEditor
const { HelperFunction: { animationAttr, IsInteraction } } = wp.qubelyComponents
class Save extends Component {
	render() {
		const { uniqueId, textField, url, iconName, iconPosition, buttonSize, customClassName, animation, interaction } = this.props.attributes
		const interactionClass = IsInteraction(interaction) ? 'qubley-block-interaction' : '';
		return (
			<div className={`qubely-block-${uniqueId} ${customClassName ? customClassName : ''}`} {...animationAttr(animation)}>
				<div className={`qubely-block-btn-wrapper ${interactionClass}`}>
					<div className={`qubely-block-btn`}>
						<a className={`qubely-block-btn-anchor is-${buttonSize}`} href={url.url ? url.url : '#'} {...(url.target && { target: '_blank' })} {...(url.nofollow ? { rel: 'nofollow noopener noreferrer' } : {...url.target && { rel: 'noopener noreferrer' }}  )} >
							{(iconName.trim() != "") && (iconPosition == 'left') && (<i className={`qubely-btn-icon ${iconName}`} />)}
							<RichText.Content value={(textField == '') ? 'Add Text...' : textField} />
							{(iconName.trim() != "") && (iconPosition == 'right') && (<i className={`qubely-btn-icon ${iconName}`} />)}
						</a>
					</div>
				</div>
			</div>
		)
	}
}
export default Save