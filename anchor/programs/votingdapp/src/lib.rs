#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("A5eeNFZzCzoWBcQT4Z7EWPRhozgRAqqm2gHSDNDL6YUX");

const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod votingdapp {

    use super::*;

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        poll_start: u64,
        poll_end: u64,
        description: String,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll_account;

        // Set the defualt values
        poll.poll_id = poll_id;
        poll.description = description;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;
        poll.candidate_amount = 0;

        Ok(())
    }

    pub fn initialize_candidate(
        ctx: Context<InitializeCandidate>,
        _poll_id: u64,
        candidate_name: String,
    ) -> Result<()> {
        ctx.accounts.candidate_account.candidate_name = candidate_name;

        // You can also add the comments to log things
        //msg!(
        //    "Candidate Count: {}",
        //    ctx.accounts.poll_account.candidate_amount
        //);

        ctx.accounts.poll_account.candidate_amount += 1;

        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, _poll_id: u64, _candidate_name: String) -> Result<()> {
        if ctx.accounts.vote_account.has_voted {
            return Err(ErrorCode::AlreadyVoted.into());
        }

        // Check for the current time and verify it falls in voting time
        let current_time = Clock::get()?.unix_timestamp;

        if current_time > (ctx.accounts.poll_account.poll_end as i64) {
            return Err(ErrorCode::VotingEnded.into());
        }

        if current_time <= (ctx.accounts.poll_account.poll_start as i64) {
            return Err(ErrorCode::VotingNotStarted.into());
        }

        ctx.accounts.candidate_account.candidate_votes += 1;

        ctx.accounts.vote_account.has_voted = true;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR_SIZE+ PollAccount::INIT_SPACE,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll_account: Account<'info, PollAccount>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct PollAccount {
    pub poll_id: u64,
    #[max_len(280)]
    pub description: String,
    pub poll_start: u64,
    pub poll_end: u64,
    pub candidate_amount: u64,
}

#[derive(Accounts)]
#[instruction(poll_id: u64, candidate_name: String)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll_account: Account<'info, PollAccount>,

    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR_SIZE + CandidateAccount::INIT_SPACE,
        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump
    )]
    pub candidate_account: Account<'info, CandidateAccount>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct CandidateAccount {
    #[max_len(32)]
    pub candidate_name: String,

    pub candidate_votes: u64,
}

// For a non-PDA transaction for vote:
//
///#[derive(Accounts)]
///#[instruction(poll_id: u64, candidate_name: String)]
///pub struct Vote<'info> {
//    pub signer: Signer<'info>,
//
//    #[account(
//        seeds = [poll_id.to_le_bytes().as_ref()],
//        bump
//    )]
//    pub poll_account: Account<'info, PollAccount>,
//
//    #[account(
//        mut,
//        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
//        bump
//    )]
//    pub candidate_account: Account<'info, CandidateAccount>,
///}

#[derive(Accounts)]
#[instruction(poll_id: u64, candidate_name: String)]
pub struct Vote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll_account: Account<'info, PollAccount>,

    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump
    )]
    pub candidate_account: Account<'info, CandidateAccount>,

    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR_SIZE + VoteAccount::INIT_SPACE,
        seeds = [poll_id.to_le_bytes().as_ref(), signer.key().as_ref()],
        bump
    )]
    pub vote_account: Account<'info, VoteAccount>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct VoteAccount {
    pub has_voted: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Voting has not started yet")]
    VotingNotStarted,
    #[msg("Voting has ended")]
    VotingEnded,
    #[msg("User has already voted")]
    AlreadyVoted,
}
