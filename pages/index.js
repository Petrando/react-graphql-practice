import { useState, useEffect } from 'react'
import axios from 'axios';
import {Box, Button, Container, TextField, Typography} from '@mui/material/';
import FormDialog from '../components/globals/Dialog';

const axiosGitHubGraphQL = (token) => {
  return axios.create({
    baseURL: 'https://api.github.com/graphql',
    headers: {
      Authorization: `bearer ${token}`
    }
  })
}

const GET_REPOSITORY_AND_ISSUES = `
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
  const [token, setToken] = useState('')
  const [tokenError, setTokkenError] = useState(false)
  const [path, setPath] = useState('the-road-to-learn-react/the-road-to-learn-react')
  const [organization, setOrganization] = useState(null)
  const [errors, setErrors] = useState(null)
  const [starred, setStarred] = useState(false)
  const [starCount, setStarCount] = useState(0)

  const onSubmit = (e) => {
    e.preventDefault()
    onFetchFromGitHub(path)    
  }

  const onChange = (e) => {
    setPath(e.target.value)
  }

  const getIssuesOfRepository = (path, cursor) => {
    const [organization, repository] = path.split('/')

    return (
      axiosGitHubGraphQL(token)
        .post('', { query:GET_REPOSITORY_AND_ISSUES, variables: {organization, repository, cursor}})
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
          setTokkenError(false)
          setErrors(result.data.errors)
        }
      })
      .catch(err => {
        setTokkenError(true)
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

  if(!organization || tokenError){
    return (
      <FormDialog token={token} setToken={setToken} startFetch={()=>{onFetchFromGitHub(path)}} tokenError={tokenError} />
    )
  }
//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

  return (
    <Container maxWidt="sm">

      <main>
        <Typography variant="h3" component="div" gutterBottom>
          Practice Graphql with GitHub API
        </Typography>
        <Box component="form" onSubmit={onSubmit}
          style={{display:"flex", justifyContent:"center", alignItems:"center"}}
        >
          <TextField
            id="url"
            type="text"
            label="Show open issues for https://github.com"
            value={path}
            onChange={onChange}
          />
          <Button style={{marginLeft:"5px"}} variant="contained" type="submit">Search</Button>
        </Box>
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
    </Container>
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