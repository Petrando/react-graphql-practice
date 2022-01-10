import { useState, useEffect } from 'react'
import axios from 'axios';
import {Box, Button, Card, CardContent, Container, Divider, Grid, List, ListItem, TextField, Typography} from '@mui/material/';
import { Star, StarBorder } from '@mui/icons-material';
import FormDialog from '../components/globals/Dialog';
import Footer from '../components/globals/Footer';

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
    <Container maxWidth="sm"> 
        <Typography variant="h3" component="div" gutterBottom style={{textAlign:"center"}}>
          Practice Graphql with GitHub API
        </Typography>
        <Box component="form" sx={{ display:"flex", justifyContent:"center", alignItems:"center", margin:"5px auto" }} onSubmit={onSubmit}>
          <TextField
            id="url"
            type="text"
            label="Show open issues for https://github.com"
            value={path}
            onChange={onChange}
            />
          <Button sx={{marginLeft:"5px"}} variant="contained" type="submit">Search</Button>
        </Box>
        <Divider />
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
          <Typography variant="h4" component="div">No info yet....</Typography>
        }
      

      <Footer />
    </Container>
  )
}

const Organization = ({organization:{name, url, repository}, errors, onFetchMoreIssues, hasNextPage, onStarRepository, starred, starCount}) => {
  if (errors) {
    return (
      <Typography variant="subtitle2" gutterBottom component="div">
        <strong>Something went wrong:</strong>
        {
          errors.map(error => error.message).join(' ')
        }
      </Typography>
    );
  }
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom component="div">
        <strong>
          Issues from organization <a href={url} target="_blank">{name}</a>
        </strong>
      </Typography>
      <Repository 
        repository={repository} 
        onFetchMoreIssues={onFetchMoreIssues} 
        hasNextPage={hasNextPage}
        onStarRepository={onStarRepository}
        starred={starred}
        starCount={starCount}
      />
    </Box>
  )
}

const Repository = ({ repository:{id, url, name, issues}, onFetchMoreIssues, hasNextPage, onStarRepository, starred, starCount}) => {

  return(
    <Box>
       <Typography variant="subtitle1" gutterBottom component="div">
        <strong>In Repository </strong>
        <a href={url} target="_blank">{name}</a>
      </Typography>
      {
        issues &&
        <>
        <List>
          {
            issues.edges.map((issue) => {
              //console.log(issue)
              return (          
                <ListItem disablePadding key={issue.node.id}>
                  <Card sx={{width:"100%"}}>
                    <CardContent>
                      <a href={issue.node.url} target="_blank">
                        <Typography variant="h6" gutterBottom component="div">
                          {issue.node.title}
                        </Typography>
                      </a>
                      <IssueReactions reactions={issue.node.reactions} />
                    </CardContent>                                
                  </Card>            
                </ListItem>
                                                
              )
            })
          }
        </List>
        <Divider />
          <Button variant="outlined" onClick={onFetchMoreIssues}>{hasNextPage?"Next 5 issues":"First 5 issues"}</Button>
          <Button variant="outlined" 
                  startIcon={starred?<Star />:<StarBorder />}
                  onClick={()=>{
                            onStarRepository(id, starred)
                          }}
          >
            {starred?'Unstar':'Star'}
          </Button>
          <span style={{marginLeft:"5px"}}>{starCount} stars</span>
        </>
      }
    </Box>
  )
}

const IssueReactions = ({reactions:{edges}}) => {
  //console.log(edges)
  if(edges.length === 0) {
    return (
      <Typography variant="overline" gutterBottom>
        No Reaction....
      </Typography>
    )
  }

  return (
    <>
      <Typography variant="overline" gutterBottom>
        Last 3 Reactions
      </Typography>
      <List>
        {
          edges.map(edge => {
            return (
              <ListItem key={edge.node.id}>{edge.node.content}</ListItem>
            )
          })
        }
      </List>
    </>

  )
}
