import { useState, useEffect } from 'react'
import Head from 'next/head'
import axios from 'axios';
import FormDialog from '../components/globals/Dialog';

const axiosGitHubGraphQL = (token) => {
  return axios.create({
    baseURL: 'https://api.github.com/graphql',
    headers: {
      Authorization: `bearer ${token}`
    }
  })
}

const GET_ORGANIZATION = `
  {
    organization(login: "the-road-to-learn-react") {
      name
      url
    }
  }
`

const GET_REPOSITORY_OF_ORGANIZATION = `
  {
    organization(login: "the-road-to-learn-react") {
      name
      url
      repository(name: "the-road-to-learn-react") {
        name
        url
      }
    }
  }
`
/*
const GET_ISSUES_OF_REPOSITORY = `
  {
    organization(login: "the-road-to-learn-react") {
      name
      url
      repository(name: "the-road-to-learn-react") {
        name
        url
        issues(last: 5) {
          edges {
            node {
              id
              title
              url
            }
          }
        }
      }
    }
  }
`*/

const GET_ISSUES_OF_REPOSITORY = `
  query($organization: String!, $repository: String!, $cursor: String) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        id
        name
        url
        stargazers {
          totalCount
        }
        viewerHasStarred
        issues(first: 5, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`

const ADD_STAR = `
  mutation ($repositoryId: ID!) {
    addStar(input:{starrableId:$repositoryId}) {
      starrable {
        viewerHasStarred
        stargazerCount
      }
    }
  }
`

const REMOVE_STAR = `
  mutation ($repositoryId: ID!) {
    removeStar(input:{starrableId:$repositoryId}) {
      starrable {
        viewerHasStarred
        stargazerCount
      }
    }
  }
`
const changeRepoStar = (repositoryId, viewerHasStarred, token) => {
  return axiosGitHubGraphQL(token).post('', {
    query: !viewerHasStarred?ADD_STAR:REMOVE_STAR, 
    variables: { repositoryId }
  })
}

export default function Home() {
  const [token, setToken] = useState('');
  const [path, setPath] = useState('the-road-to-learn-react/the-road-to-learn-react')
  const [organization, setOrganization] = useState(null)
  const [errors, setErrors] = useState(null)
  const [starred, setStarred] = useState(false)
  const [starCount, setStarCount] = useState(0)

  useEffect(()=>{
    //onFetchFromGitHub(path)
  }, [])

  const onSubmit = (e) => {
    e.preventDefault()
    onFetchFromGitHub(path)    
  }

  const onChange = (e) => {
    setPath(e.target.value)
  }

  const getIssuesOfRepositoryQuery = (org, repository) => {
    return (
      `
        {
          organization(login: "${organization}"){
            name
            url
            repository(name: "${repository}") {
              name
              url
              issues(last: 5) {
                edges {
                  node {
                    id
                    title
                    url
                  }
                }
              }
            }
          }
        }
      `
    )
  }
  
  const getIssuesOfRepository = (path, cursor) => {
    const [organization, repository] = path.split('/')

    return (
      axiosGitHubGraphQL(token)
        //.post('', { query: getIssuesOfRepositoryQuery(organization, repository)})
        .post('', { query:GET_ISSUES_OF_REPOSITORY, variables: {organization, repository, cursor}})
    )
  } 

  const onFetchFromGitHub = (path, cursor) => {
    getIssuesOfRepository(path, cursor)
      .then(result => {
        console.log(result)
        if(result.data){
          if(result.data.data){
            setOrganization(result.data.data.organization)
            setStarred(result.data.data.organization.repository.viewerHasStarred)
            setStarCount(result.data.data.organization.repository.stargazers.totalCount)
          }
          setErrors(result.data.errors)
        }
      })
  }

  const onFetchMoreIssues = () => {
    const { endCursor } = organization.repository.issues.pageInfo

    onFetchFromGitHub(path, endCursor)
  }

  const onStarRepository = (repositoryId, viewerHasStarred) => {
    changeRepoStar(repositoryId, starred, token)
      .then(result =>{
        console.log(result)
        if(!starred){
          setStarred(result.data.data.addStar.starrable.viewerHasStarred)
          setStarCount(result.data.data.addStar.starrable.stargazerCount)
        }
        else {
          setStarred(result.data.data.removeStar.starrable.viewerHasStarred)
          setStarCount(result.data.data.removeStar.starrable.stargazerCount)
        }
                 
        
      })
  }

  if(!organization){
    console.log('not initialized')
    return (
      <FormDialog token={token} setToken={setToken} startFetch={()=>{onFetchFromGitHub(path)}} />
    )
  }
//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

  return (
    <div className="container">
      <Head>
        <title>GraphQl Github Practice</title>
        <link rel="icon" href="/graphql.ico" />
      </Head>

      <main>
        <h1 className="title">
          Practice Graphql <a href="https://nextjs.org">Next.js!</a>
        </h1>
        <form onSubmit={onSubmit}>
          <label htmlFor="url">
            Show open issues for https://github.com
          </label>
          <input
            id="url"
            type="text"
            value={path}
            onChange={onChange}
            style={{width:"300px"}}
          />
          <button type="submit">Search</button>
        </form>
        <hr />
        {
          organization?
          <Organization 
            organization={organization} 
            errors={errors} 
            onFetchMoreIssues={onFetchMoreIssues} 
            hasNextPage={organization.repository.issues.pageInfo.hasNextPage}
            onStarRepository={onStarRepository}
            starred={starred}
            starCount={starCount}
          />:
          <h3>No info yet....</h3>
        }
      </main>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel" className="logo" />
        </a>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

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

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }

        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }

        .grid {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;

          max-width: 800px;
          margin-top: 3rem;
        }

        .card {
          margin: 1rem;
          flex-basis: 45%;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .card:hover,
        .card:focus,
        .card:active {
          color: #0070f3;
          border-color: #0070f3;
        }

        .card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .logo {
          height: 1em;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}

const Organization = ({organization:{name, url, repository}, errors, onFetchMoreIssues, hasNextPage, onStarRepository, starred, starCount}) => {
  if (errors) {
    return (
    <p>
    <strong>Something went wrong:</strong>
      {
        errors.map(error => error.message).join(' ')
      }
    </p>
    );
  }

  //console.log(repository)
  return (
    <div>
      <p>
        <strong>
          Issues from organization <a href={url}>{name}</a>
        </strong>
      </p>
      <Repository 
        repository={repository} 
        onFetchMoreIssues={onFetchMoreIssues} 
        hasNextPage={hasNextPage}
        onStarRepository={onStarRepository}
        starred={starred}
        starCount={starCount}
      />
    </div>
  )
}

const Repository = ({ repository:{id, url, name, issues, viewerHasStarred}, onFetchMoreIssues, hasNextPage, onStarRepository, starred, starCount}) => {

  useEffect(()=>{
    console.log(starred)
  }, [starred])

  return(
    <div>
      <p>
        <strong>In Repository </strong>
        <a href={url}>{name}</a>
      </p>
      {
        issues &&
        <>
        <ul>
          {
            issues.edges.map((issue) => {
              //console.log(issue)
              return (          
                <li key={issue.node.id}>
                  <a href={issue.node.url}>{issue.node.title}</a>
                  <IssueReactions reactions={issue.node.reactions} />
                </li>
                                                
              )
            })
          }
        </ul>
        <hr />
        <button onClick={onFetchMoreIssues} disabled={!hasNextPage}>Next 5 issues</button>
        <button onClick={()=>{
                          onStarRepository(id, starred)
                        }}
        >
          {starred?'Unstar':'Star'}
        </button>
        <span>{starCount} stars</span>
        </>
      }
    </div>
  )
}

const IssueReactions = ({reactions:{edges}}) => {
  //console.log(edges)
  if(edges.length === 0) {
    return <></>
  }

  return (
    <>
      <p>Reactions</p>
      <ul>
        {
          edges.map(edge => {
            return (
              <li key={edge.node.id}>{edge.node.content}</li>
            )
          })
        }
      </ul>
    </>

  )
}

/*
<p className="description">
          Get started by editing <code>pages/index.js</code>
        </p>

        <div className="grid">
          <a href="https://nextjs.org/docs" className="card">
            <h3>Documentation &rarr;</h3>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>

          <a href="https://nextjs.org/learn" className="card">
            <h3>Learn &rarr;</h3>
            <p>Learn about Next.js in an interactive course with quizzes!</p>
          </a>

          <a
            href="https://github.com/vercel/next.js/tree/master/examples"
            className="card"
          >
            <h3>Examples &rarr;</h3>
            <p>Discover and deploy boilerplate example Next.js projects.</p>
          </a>

          <a
            href="https://vercel.com/import?filter=next.js&utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className="card"
          >
            <h3>Deploy &rarr;</h3>
            <p>
              Instantly deploy your Next.js site to a public URL with Vercel.
            </p>
          </a>
        </div>*/