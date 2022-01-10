const Footer = () => {
    return (
        <footer>
            <a
                href="https://petrandorich.herokuapp.com/"
                target="_blank"
                rel="noopener noreferrer"
            >
                Created by {" "} <span className={"myName"}>Petrando Richard</span>
            </a>
            <style jsx>{`
                footer {
                    width: 100%;
                    height: 100px;
                    border-top: 1px solid #eaeaea;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                  }
                
                  footer img {
                    margin-left: 0.5rem;
                  }
                
                  footer a {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                  }
                
                  a {
                    color: inherit;
                    text-decoration: none;
                  }
                
                  .title a, .myName {
                    color: #0070f3;
                    text-decoration: none;
                  }
                
                  .myName {
                    font-weight: bold;
                    margin-left:6px;
                  }

                  .myName:hover, .myName:focus, .myName:active {
                    text-decoration: underline;
                  }
            `}</style>
        </footer>
    )
}

export default Footer;