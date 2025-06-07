import React from 'react'

const BackButton = ({onClick}) => {
    return (
        <button
                className="back-button"
                onClick={onClick}
              >
                <span className="back-icon">←</span>
                العودة للخلف
              </button>
    )
}

export default BackButton